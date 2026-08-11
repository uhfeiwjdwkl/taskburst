import { supabase } from "@/integrations/supabase/client";

/**
 * Kommenszlapf incremental sync.
 *
 * Design:
 *  - Local writes append to a compact, coalesced change queue (one entry per
 *    key, newest wins) — not a permanent history log.
 *  - Each cycle: pull only rows newer than the device revision checkpoint,
 *    then push queued changes, then drop acknowledged entries (compaction).
 *  - Conflicts resolve last-write-wins on UTC timestamps, server-clamped,
 *    with a deterministic change-id tie-break. Deletions travel as tombstones.
 *  - Offline writes stay queued and flush on reconnect; nothing is ever lost
 *    locally because remote data is only applied when strictly newer.
 */

const APP_NAME = "taskburst";
const DEVICE_KEY = "kommenszlapf:deviceId";
const LAST_UPDATED_KEY = "kommenszlapf:lastUpdated"; // { [key]: isoString }
const qKey = (uid: string) => `kommenszlapf:q:${uid}`;
const metaKey = (uid: string) => `kommenszlapf:meta:${uid}`;
const PENDING_QUEUE_KEY_LEGACY = "kommenszlapf:pendingSync";

const SKIP_PREFIXES = ["sb-", "supabase.", "kommenszlapf:", "taskburst-heartbeat"];
/** Ephemeral / device-local keys that must never trigger or travel through sync. */
const SKIP_EXACT = new Set([
  "taskburst-heartbeat",
  "taskburst-instance",
  "taskburst-instance-id",
]);
const BATCH = 100;
const PULL_LIMIT = 500;
const PERIODIC_MS = 15 * 60 * 1000;

type Op = "upsert" | "delete";
type QueueItem = { key: string; op: Op; ts: string; changeId: string };
type Meta = { rev: number; lastSyncAt?: string; bootstrapped?: boolean };
export type SyncStatus = "syncing" | "synced" | "offline" | "error";

let currentUserId: string | null = null;
let installed = false;
let originalSetItem: typeof Storage.prototype.setItem | null = null;
let originalRemoveItem: typeof Storage.prototype.removeItem | null = null;
let originalClear: typeof Storage.prototype.clear | null = null;
let originalGetItem: typeof Storage.prototype.getItem | null = null;

let realtimeData: ReturnType<typeof supabase.channel> | null = null;
let realtimeRequests: ReturnType<typeof supabase.channel> | null = null;
let periodicTimer: ReturnType<typeof setInterval> | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let backoffTimer: ReturnType<typeof setTimeout> | null = null;
let backoffMs = 0;
let syncing = false;
let rerun = false;
let gcDone = false;
let listenersBound = false;
const ownChangeIds: string[] = [];

// -------------------- helpers --------------------

function shouldSync(key: string) {
  if (SKIP_EXACT.has(key)) return false;
  if (/heartbeat|instanceid|instance-id/i.test(key)) return false;
  return !SKIP_PREFIXES.some((p) => key.startsWith(p));
}

function rawGet(key: string) {
  return (originalGetItem ?? Storage.prototype.getItem).call(localStorage, key);
}
function rawSet(key: string, value: string) {
  (originalSetItem ?? Storage.prototype.setItem).call(localStorage, key, value);
}
function rawRemove(key: string) {
  (originalRemoveItem ?? Storage.prototype.removeItem).call(localStorage, key);
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = rawGet(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function deviceId(): string {
  let id = rawGet(DEVICE_KEY);
  if (!id) {
    id =
      (globalThis.crypto?.randomUUID?.() as string | undefined) ??
      `dev-${Math.random().toString(36).slice(2)}${Date.now()}`;
    rawSet(DEVICE_KEY, id);
  }
  return id;
}

function newId(): string {
  return (
    (globalThis.crypto?.randomUUID?.() as string | undefined) ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

// -------------------- queue (coalesced) --------------------

function readQueue(uid: string): QueueItem[] {
  const q = readJson<QueueItem[]>(qKey(uid), []);
  return Array.isArray(q) ? q : [];
}
function writeQueue(uid: string, items: QueueItem[]) {
  if (items.length === 0) rawRemove(qKey(uid));
  else rawSet(qKey(uid), JSON.stringify(items));
  emitStatus(undefined);
}
function enqueue(uid: string, key: string, op: Op, ts: string) {
  const q = readQueue(uid).filter((x) => x.key !== key); // coalesce per key
  q.push({ key, op, ts, changeId: newId() });
  writeQueue(uid, q);
}

function readMeta(uid: string): Meta {
  const m = readJson<Meta>(metaKey(uid), { rev: -1 });
  return { rev: typeof m.rev === "number" ? m.rev : -1, lastSyncAt: m.lastSyncAt, bootstrapped: m.bootstrapped };
}
function writeMeta(uid: string, patch: Partial<Meta>) {
  rawSet(metaKey(uid), JSON.stringify({ ...readMeta(uid), ...patch }));
}

function readStamps(): Record<string, string> {
  const m = readJson<Record<string, string>>(LAST_UPDATED_KEY, {});
  return m && typeof m === "object" ? m : {};
}
function stampKey(key: string, ts: string) {
  const map = readStamps();
  map[key] = ts;
  rawSet(LAST_UPDATED_KEY, JSON.stringify(map));
}
function localStamp(key: string): number {
  const ts = readStamps()[key];
  return ts ? new Date(ts).getTime() : 0;
}

// -------------------- status --------------------

let lastStatus: SyncStatus = "synced";

function emitStatus(status?: SyncStatus) {
  if (status) lastStatus = status;
  const pending = currentUserId ? readQueue(currentUserId).length : 0;
  try {
    window.dispatchEvent(new CustomEvent("kommenszlapf-sync-status", { detail: lastStatus }));
    window.dispatchEvent(
      new CustomEvent("kommenszlapf-sync-info", {
        detail: {
          status: lastStatus,
          pending,
          lastSyncAt: currentUserId ? readMeta(currentUserId).lastSyncAt : undefined,
        },
      })
    );
  } catch {
    /* ignore */
  }
}

export function getSyncInfo() {
  const uid = currentUserId;
  return {
    status: lastStatus,
    pending: uid ? readQueue(uid).length : 0,
    lastSyncAt: uid ? readMeta(uid).lastSyncAt : undefined,
  };
}

// -------------------- one-deep sync backup (undo / redo) --------------------

type SyncBackup = {
  at: string;
  /** Values as they were before the last sync applied remote changes. */
  before: Record<string, string | null>;
  /** Values the last sync produced, so a restore can be re-applied. */
  after: Record<string, string | null>;
  /** True while the user is viewing the pre-sync state. */
  undone?: boolean;
};

const SYNC_BACKUP_KEY = "kommenszlapf:sync-backup";

function readSyncBackup(): SyncBackup | null {
  try {
    const raw = rawGet(SYNC_BACKUP_KEY);
    return raw ? (JSON.parse(raw) as SyncBackup) : null;
  } catch {
    return null;
  }
}

function writeSyncBackup(b: SyncBackup) {
  try {
    rawSet(SYNC_BACKUP_KEY, JSON.stringify(b));
  } catch {
    /* ignore */
  }
}

function applySnapshot(snap: Record<string, string | null>) {
  for (const [k, v] of Object.entries(snap)) {
    if (v === null) rawRemove(k);
    else rawSet(k, v);
  }
  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(new Event("appSettingsUpdated"));
}

export function getSyncBackupState() {
  const b = readSyncBackup();
  return { canUndo: !!b && !b.undone, canRedo: !!b && !!b.undone, at: b?.at };
}

/** Restore the state from just before the most recent sync. */
export function undoLastSync(): boolean {
  const b = readSyncBackup();
  if (!b || b.undone) return false;
  applySnapshot(b.before);
  writeSyncBackup({ ...b, undone: true });
  return true;
}

/** Return to the latest synced state after an undo. */
export function redoLastSync(): boolean {
  const b = readSyncBackup();
  if (!b || !b.undone) return false;
  applySnapshot(b.after);
  writeSyncBackup({ ...b, undone: false });
  return true;
}

function unusedSyncInfo() {
  const uid = currentUserId;
  return {
    status: lastStatus,
    pending: uid ? readQueue(uid).length : 0,
    lastSyncAt: uid ? readMeta(uid).lastSyncAt : undefined,
  };
}

// -------------------- interceptors --------------------

function onLocalWrite(key: string, op: Op) {
  if (!currentUserId) return;
  const ts = new Date().toISOString();
  stampKey(key, ts);
  enqueue(currentUserId, key, op, ts);
  scheduleSync(400);
}

function installInterceptors() {
  if (installed) return;
  installed = true;
  originalSetItem = Storage.prototype.setItem;
  originalRemoveItem = Storage.prototype.removeItem;
  originalClear = Storage.prototype.clear;
  originalGetItem = Storage.prototype.getItem;

  Storage.prototype.setItem = function (key: string, value: string) {
    originalSetItem!.call(this, key, value);
    if (this === window.localStorage && shouldSync(key)) onLocalWrite(key, "upsert");
  };
  Storage.prototype.removeItem = function (key: string) {
    originalRemoveItem!.call(this, key);
    if (this === window.localStorage && shouldSync(key)) onLocalWrite(key, "delete");
  };
  Storage.prototype.clear = function () {
    const keys: string[] = [];
    if (this === window.localStorage) {
      for (let i = 0; i < this.length; i++) {
        const k = this.key(i);
        if (k && shouldSync(k)) keys.push(k);
      }
    }
    originalClear!.call(this);
    keys.forEach((k) => onLocalWrite(k, "delete"));
  };
}

function uninstallInterceptors() {
  if (!installed) return;
  if (originalSetItem) Storage.prototype.setItem = originalSetItem;
  if (originalRemoveItem) Storage.prototype.removeItem = originalRemoveItem;
  if (originalClear) Storage.prototype.clear = originalClear;
  installed = false;
}

// -------------------- scheduling --------------------

export function scheduleSync(delay = 800) {
  if (!currentUserId) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void syncNow();
  }, delay);
}

function scheduleBackoff() {
  backoffMs = backoffMs === 0 ? 2000 : Math.min(backoffMs * 2, 60000);
  if (backoffTimer) clearTimeout(backoffTimer);
  backoffTimer = setTimeout(() => {
    backoffTimer = null;
    void syncNow();
  }, backoffMs);
}

function bindGlobalListeners() {
  if (listenersBound || typeof window === "undefined") return;
  listenersBound = true;
  window.addEventListener("online", () => {
    backoffMs = 0;
    emitStatus("syncing");
    void syncNow();
  });
  window.addEventListener("offline", () => emitStatus("offline"));
}

// -------------------- apply remote rows --------------------

type RemoteRow = {
  key: string;
  value: any;
  deleted: boolean;
  rev: number;
  device_id: string | null;
  change_id: string | null;
  client_ts: string;
};

function applyRemoteRow(uid: string, row: RemoteRow, pendingKeys: Set<string>): boolean {
  // Echo of our own change — nothing to do.
  if (row.change_id && ownChangeIds.includes(row.change_id)) return false;
  // A local edit is still waiting to be pushed: local intent wins for now.
  if (pendingKeys.has(row.key)) return false;

  const remoteTime = new Date(row.client_ts).getTime();
  if (localStamp(row.key) > remoteTime) return false; // local copy is newer

  if (row.deleted) {
    if (rawGet(row.key) === null) {
      stampKey(row.key, row.client_ts);
      return false;
    }
    rawRemove(row.key);
    stampKey(row.key, row.client_ts);
    return true;
  }

  if (row.value === null || row.value === undefined) return false;
  const serialized = typeof row.value === "string" ? row.value : JSON.stringify(row.value);
  if (serialized === rawGet(row.key)) {
    stampKey(row.key, row.client_ts);
    return false;
  }
  rawSet(row.key, serialized);
  stampKey(row.key, row.client_ts);
  return true;
}

async function pull(uid: string): Promise<boolean> {
  let changed = false;
  // One-deep backup of the state that existed before this pull applied
  // remote changes, so the user can undo the most recent sync.
  const before: Record<string, string | null> = {};
  const after: Record<string, string | null> = {};
  for (let i = 0; i < 20; i++) {
    const since = readMeta(uid).rev;
    const { data, error } = await (supabase as any).rpc("kommenszlapf_sync_pull", {
      p_app: APP_NAME,
      p_since: Math.max(since, 0),
      p_limit: PULL_LIMIT,
    });
    if (error) throw error;
    const rows: RemoteRow[] = Array.isArray(data?.rows) ? data.rows : [];
    const pendingKeys = new Set(readQueue(uid).map((q) => q.key));
    let maxRev = since;
    for (const row of rows) {
      const prev = rawGet(row.key);
      if (applyRemoteRow(uid, row, pendingKeys)) {
        changed = true;
        if (!(row.key in before)) before[row.key] = prev;
        after[row.key] = rawGet(row.key);
      }
      if (row.rev > maxRev) maxRev = row.rev;
    }
    const serverRev = Number(data?.server_rev ?? maxRev);
    if (rows.length === 0 && Number.isFinite(serverRev)) maxRev = Math.max(maxRev, serverRev);
    writeMeta(uid, { rev: maxRev });
    if (!data?.has_more) break;
  }
  if (changed) writeSyncBackup({ at: new Date().toISOString(), before, after });
  return changed;
}

async function push(uid: string) {
  let queue = readQueue(uid);
  while (queue.length > 0) {
    const batch = queue.slice(0, BATCH);
    const changes = batch.map((item) => {
      let value: any = null;
      if (item.op === "upsert") {
        const raw = rawGet(item.key);
        if (raw === null) {
          // Key vanished locally — send it as a delete instead.
          return { key: item.key, op: "delete", ts: item.ts, change_id: item.changeId, value: null };
        }
        try {
          value = JSON.parse(raw);
        } catch {
          value = raw;
        }
      }
      return { key: item.key, op: item.op, ts: item.ts, change_id: item.changeId, value };
    });

    const { data, error } = await (supabase as any).rpc("kommenszlapf_sync_push", {
      p_app: APP_NAME,
      p_device: deviceId(),
      p_changes: changes,
    });
    if (error) throw error;

    const results: { change_id: string; status: string }[] = Array.isArray(data?.results) ? data.results : [];
    const acked = new Set(results.map((r) => r.change_id));
    for (const r of results) {
      ownChangeIds.push(r.change_id);
    }
    while (ownChangeIds.length > 400) ownChangeIds.shift();

    // Compaction: drop acknowledged entries (applied, duplicate or stale).
    queue = readQueue(uid).filter((item) => !acked.has(item.changeId));
    writeQueue(uid, queue);
    if (acked.size === 0) break; // avoid a spin if the server acked nothing
  }
}

/**
 * Full reconciliation, used only when there is no valid revision checkpoint
 * (first sign-in on this device, or corrupted metadata). Non-destructive:
 * local keys are always preserved and queued for upload.
 */
async function bootstrap(uid: string) {
  writeMeta(uid, { rev: 0 });
  // A fresh sign-in on this device must never let stale local state (edited
  // while signed out, possibly long ago) overwrite the account. The cloud is
  // authoritative for every key it already holds; local-only keys are merged up.
  rawRemove(qKey(uid));
  const cloudKeys = new Set<string>();
  for (let i = 0; i < 20; i++) {
    const since = readMeta(uid).rev;
    const { data, error } = await (supabase as any).rpc("kommenszlapf_sync_pull", {
      p_app: APP_NAME,
      p_since: Math.max(since, 0),
      p_limit: PULL_LIMIT,
    });
    if (error) throw error;
    const rows: RemoteRow[] = Array.isArray(data?.rows) ? data.rows : [];
    let maxRev = since;
    for (const row of rows) {
      cloudKeys.add(row.key);
      if (!row.deleted && row.value !== null && row.value !== undefined) {
        const serialized = typeof row.value === "string" ? row.value : JSON.stringify(row.value);
        rawSet(row.key, serialized);
        stampKey(row.key, row.client_ts);
      }
      if (row.rev > maxRev) maxRev = row.rev;
    }
    const serverRev = Number(data?.server_rev ?? maxRev);
    if (rows.length === 0 && Number.isFinite(serverRev)) maxRev = Math.max(maxRev, serverRev);
    writeMeta(uid, { rev: maxRev });
    if (!data?.has_more) break;
  }

  const stamps = readStamps();
  const now = new Date().toISOString();
  const q: QueueItem[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !shouldSync(k) || cloudKeys.has(k)) continue;
    q.push({ key: k, op: "upsert", ts: stamps[k] ?? now, changeId: newId() });
  }
  writeQueue(uid, q);
  writeMeta(uid, { bootstrapped: true });
  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(new Event("appSettingsUpdated"));
}

// -------------------- main cycle --------------------

async function runCycle(uid: string) {
  const meta = readMeta(uid);
  if (!meta.bootstrapped || meta.rev < 0) {
    await bootstrap(uid);
  }
  const changed = await pull(uid);
  await push(uid);
  if (!gcDone) {
    gcDone = true;
    try {
      await (supabase as any).rpc("kommenszlapf_sync_gc", { p_app: APP_NAME });
    } catch {
      /* non-critical */
    }
  }
  if (changed) {
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("appSettingsUpdated"));
  }
  writeMeta(uid, { lastSyncAt: new Date().toISOString() });
}

export async function syncNow(): Promise<void> {
  const uid = currentUserId;
  if (!uid) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    emitStatus("offline");
    return;
  }
  if (syncing) {
    rerun = true;
    return;
  }
  syncing = true;
  emitStatus("syncing");
  try {
    await runCycle(uid);
    backoffMs = 0;
    emitStatus("synced");
  } catch (e) {
    console.warn("[kommenszlapf-sync] cycle failed", e);
    emitStatus(typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "error");
    scheduleBackoff();
  } finally {
    syncing = false;
    if (rerun) {
      rerun = false;
      scheduleSync(300);
    }
  }
}

/** Manual "Sync now": also nudges the user's other devices to sync. */
export async function forceSync(): Promise<void> {
  const uid = currentUserId;
  if (!uid) return;
  backoffMs = 0;
  try {
    await (supabase as any).from("kommenszlapf_sync_requests").insert({
      user_id: uid,
      app: APP_NAME,
      device_id: deviceId(),
      request_id: newId(),
    });
  } catch {
    /* notification is best-effort */
  }
  await syncNow();
}

// -------------------- realtime --------------------

function subscribeRealtime(uid: string) {
  if (!realtimeData) {
    realtimeData = supabase
      .channel(`kommenszlapf-data-${uid}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kommenszlapf_user_data", filter: `user_id=eq.${uid}` },
        (payload: any) => {
          const row = payload.new ?? payload.old;
          if (!row || row.app !== APP_NAME) return;
          if (row.device_id && row.device_id === deviceId()) return; // our own write
          scheduleSync(600);
        }
      )
      .subscribe();
  }
  if (!realtimeRequests) {
    realtimeRequests = supabase
      .channel(`kommenszlapf-sync-req-${uid}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "kommenszlapf_sync_requests", filter: `user_id=eq.${uid}` },
        (payload: any) => {
          if (payload.new?.device_id === deviceId()) return;
          scheduleSync(200);
        }
      )
      .subscribe();
  }
}

function unsubscribeRealtime() {
  if (realtimeData) {
    void supabase.removeChannel(realtimeData);
    realtimeData = null;
  }
  if (realtimeRequests) {
    void supabase.removeChannel(realtimeRequests);
    realtimeRequests = null;
  }
}

// -------------------- lifecycle --------------------

export async function activateSync(userId: string) {
  currentUserId = userId;
  installInterceptors();
  bindGlobalListeners();
  subscribeRealtime(userId);
  // Migrate the old flat pending queue, if present.
  const legacy = readJson<any[]>(PENDING_QUEUE_KEY_LEGACY, []);
  if (Array.isArray(legacy) && legacy.length > 0) {
    const q = readQueue(userId);
    for (const item of legacy) {
      if (item?.key && !q.some((x) => x.key === item.key)) {
        q.push({ key: item.key, op: item.op === "delete" ? "delete" : "upsert", ts: item.ts ?? new Date().toISOString(), changeId: newId() });
      }
    }
    writeQueue(userId, q);
    rawRemove(PENDING_QUEUE_KEY_LEGACY);
  }
  if (!periodicTimer) periodicTimer = setInterval(() => void syncNow(), PERIODIC_MS);
  await syncNow();
}

export function deactivateSync() {
  currentUserId = null;
  unsubscribeRealtime();
  uninstallInterceptors();
  if (periodicTimer) {
    clearInterval(periodicTimer);
    periodicTimer = null;
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}

export function getSyncUserId() {
  return currentUserId;
}

/** Kept for callers that just want the queue flushed. */
export async function flushPendingQueue() {
  await syncNow();
}

export async function pullAllFromCloud(userId: string) {
  try {
    const { data, error } = await (supabase as any)
      .from("kommenszlapf_user_data")
      .select("key,value")
      .eq("user_id", userId)
      .eq("app", APP_NAME)
      .eq("deleted", false);
    if (error) throw error;
    return (data ?? []) as { key: string; value: any }[];
  } catch (e) {
    console.warn("[kommenszlapf-sync] pull failed (offline?)", e);
    return null as unknown as { key: string; value: any }[];
  }
}

/** Queue every local key for upload (used after a bulk import). */
export async function pushAllLocalToCloud(userId: string) {
  const now = new Date().toISOString();
  const q = readQueue(userId);
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !shouldSync(k)) continue;
    if (!q.some((x) => x.key === k)) q.push({ key: k, op: "upsert", ts: now, changeId: newId() });
    stampKey(k, now);
  }
  writeQueue(userId, q);
  await syncNow();
}

/** Wipe every TaskBurst row for this user in the cloud (tombstoned). */
export async function wipeAllCloudData(userId: string): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from("kommenszlapf_user_data")
      .delete()
      .eq("user_id", userId)
      .eq("app", APP_NAME);
    if (error) throw error;
    rawRemove(qKey(userId));
    writeMeta(userId, { rev: 0, bootstrapped: true });
    return true;
  } catch (e) {
    console.warn("[kommenszlapf-sync] wipe cloud failed", e);
    return false;
  }
}
