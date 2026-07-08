import { supabase } from "@/integrations/supabase/client";

const APP_NAME = "taskburst";
const PENDING_QUEUE_KEY = "kommenszlapf:pendingSync";
const LAST_UPDATED_KEY = "kommenszlapf:lastUpdated"; // { [key]: isoString }
let installed = false;
let originalSetItem: typeof Storage.prototype.setItem | null = null;
let originalRemoveItem: typeof Storage.prototype.removeItem | null = null;
let originalClear: typeof Storage.prototype.clear | null = null;
let currentUserId: string | null = null;
let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
let onlineHandler: (() => void) | null = null;

const SKIP_PREFIXES = ["sb-", "supabase.", "kommenszlapf:"];
const SKIP_KEYS = new Set<string>([]);

function shouldSync(key: string) {
  if (SKIP_KEYS.has(key)) return false;
  return !SKIP_PREFIXES.some((p) => key.startsWith(p));
}

// -------------------- pending queue helpers --------------------

type PendingItem = { key: string; op: "upsert" | "delete"; ts: string };

function readQueue(): PendingItem[] {
  try {
    const raw = (originalGetItem?.call(localStorage, PENDING_QUEUE_KEY)) ??
      localStorage.getItem(PENDING_QUEUE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function writeQueue(items: PendingItem[]) {
  const raw = JSON.stringify(items);
  (originalSetItem ?? Storage.prototype.setItem).call(localStorage, PENDING_QUEUE_KEY, raw);
}
function enqueue(item: PendingItem) {
  const q = readQueue();
  // Collapse duplicates by key — keep newest.
  const filtered = q.filter(x => x.key !== item.key);
  filtered.push(item);
  writeQueue(filtered);
}

function readLastUpdated(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LAST_UPDATED_KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw);
    return obj && typeof obj === "object" ? obj : {};
  } catch { return {}; }
}
function writeLastUpdated(map: Record<string, string>) {
  (originalSetItem ?? Storage.prototype.setItem).call(
    localStorage, LAST_UPDATED_KEY, JSON.stringify(map)
  );
}
function stampKey(key: string, ts: string) {
  const map = readLastUpdated();
  map[key] = ts;
  writeLastUpdated(map);
}

// -------------------- push (immediate) --------------------

let originalGetItem: typeof Storage.prototype.getItem | null = null;

async function pushKey(key: string, op: "upsert" | "delete", ts: string): Promise<boolean> {
  if (!currentUserId) return false;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return false;
  try {
    if (op === "delete") {
      const { error } = await (supabase as any)
        .from("kommenszlapf_user_data")
        .delete()
        .eq("user_id", currentUserId)
        .eq("app", APP_NAME)
        .eq("key", key);
      if (error) throw error;
    } else {
      const raw = localStorage.getItem(key);
      let parsed: any = raw;
      if (raw !== null) { try { parsed = JSON.parse(raw); } catch { /* keep string */ } }
      const { error } = await (supabase as any)
        .from("kommenszlapf_user_data")
        .upsert(
          { user_id: currentUserId, app: APP_NAME, key, value: parsed, updated_at: ts },
          { onConflict: "user_id,app,key" }
        );
      if (error) throw error;
    }
    return true;
  } catch (e) {
    console.warn("[kommenszlapf-sync] push failed", key, e);
    return false;
  }
}

async function handleWrite(key: string, op: "upsert" | "delete") {
  if (!currentUserId) return;
  const ts = new Date().toISOString();
  stampKey(key, ts);
  const ok = await pushKey(key, op, ts);
  if (!ok) enqueue({ key, op, ts });
  else notifySyncStatus("synced");
}

function scheduleImmediate(key: string, op: "upsert" | "delete") {
  // Fire-and-forget; UI shouldn't block on this.
  void handleWrite(key, op);
}

export async function flushPendingQueue() {
  if (!currentUserId) return;
  const q = readQueue();
  if (q.length === 0) return;
  const remaining: PendingItem[] = [];
  for (const item of q) {
    const ok = await pushKey(item.key, item.op, item.ts);
    if (!ok) remaining.push(item);
  }
  writeQueue(remaining);
  if (remaining.length === 0) notifySyncStatus("synced");
}

function notifySyncStatus(status: "syncing" | "synced" | "offline") {
  try {
    window.dispatchEvent(new CustomEvent("kommenszlapf-sync-status", { detail: status }));
  } catch { /* ignore */ }
}

// -------------------- realtime --------------------

function mergeIncomingValue(key: string, incoming: any, incomingTs: string) {
  const localRaw = localStorage.getItem(key);
  const map = readLastUpdated();
  const localTs = map[key];
  // If our local copy is newer than the incoming one, keep ours.
  if (localTs && new Date(localTs).getTime() > new Date(incomingTs).getTime()) return;
  // Otherwise adopt the incoming value.
  if (incoming === null || incoming === undefined) {
    removeItemRaw(key);
  } else {
    const serialized = typeof incoming === "string" ? incoming : JSON.stringify(incoming);
    if (serialized === localRaw) return;
    setItemRaw(key, serialized);
  }
  stampKey(key, incomingTs);
  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(new Event("appSettingsUpdated"));
}

function subscribeRealtime(userId: string) {
  if (realtimeChannel) return;
  realtimeChannel = supabase
    .channel(`kommenszlapf-user-data-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "kommenszlapf_user_data",
        filter: `user_id=eq.${userId}`,
      },
      (payload: any) => {
        try {
          const row = payload.new ?? payload.old;
          if (!row || row.app !== APP_NAME) return;
          if (payload.eventType === "DELETE") {
            mergeIncomingValue(row.key, null, new Date().toISOString());
          } else {
            mergeIncomingValue(row.key, row.value, row.updated_at || new Date().toISOString());
          }
        } catch (e) {
          console.warn("[kommenszlapf-sync] realtime handler error", e);
        }
      }
    )
    .subscribe();
}

function unsubscribeRealtime() {
  if (realtimeChannel) {
    void supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
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
    if (this === window.localStorage && shouldSync(key)) scheduleImmediate(key, "upsert");
  };
  Storage.prototype.removeItem = function (key: string) {
    originalRemoveItem!.call(this, key);
    if (this === window.localStorage && shouldSync(key)) scheduleImmediate(key, "delete");
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
    keys.forEach(k => scheduleImmediate(k, "delete"));
  };

  if (typeof window !== "undefined" && !onlineHandler) {
    onlineHandler = () => { notifySyncStatus("syncing"); void flushPendingQueue(); };
    window.addEventListener("online", onlineHandler);
    window.addEventListener("offline", () => notifySyncStatus("offline"));
  }
}

function uninstallInterceptors() {
  if (!installed) return;
  if (originalSetItem) Storage.prototype.setItem = originalSetItem;
  if (originalRemoveItem) Storage.prototype.removeItem = originalRemoveItem;
  if (originalClear) Storage.prototype.clear = originalClear;
  installed = false;
  if (onlineHandler) {
    window.removeEventListener("online", onlineHandler);
    onlineHandler = null;
  }
}

function setItemRaw(key: string, value: string) {
  (originalSetItem ?? Storage.prototype.setItem).call(localStorage, key, value);
}

function removeItemRaw(key: string) {
  (originalRemoveItem ?? Storage.prototype.removeItem).call(localStorage, key);
}

export async function pullAllFromCloud(userId: string) {
  try {
    const { data, error } = await (supabase as any)
      .from("kommenszlapf_user_data")
      .select("key,value")
      .eq("user_id", userId)
      .eq("app", APP_NAME);
    if (error) throw error;
    return (data ?? []) as { key: string; value: any }[];
  } catch (e) {
    console.warn("[kommenszlapf-sync] pull failed (offline?)", e);
    return null as unknown as { key: string; value: any }[]; // signal failure
  }
}

export async function pushAllLocalToCloud(userId: string) {
  const rows: { user_id: string; app: string; key: string; value: any }[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !shouldSync(k)) continue;
    const raw = localStorage.getItem(k);
    if (raw === null) continue;
    let parsed: any = raw;
    try { parsed = JSON.parse(raw); } catch { /* keep string */ }
    rows.push({ user_id: userId, app: APP_NAME, key: k, value: parsed });
  }
  if (rows.length === 0) return;
  try {
    const { error } = await (supabase as any)
      .from("kommenszlapf_user_data")
      .upsert(rows, { onConflict: "user_id,app,key" });
    if (error) throw error;
  } catch (e) {
    console.warn("[kommenszlapf-sync] push failed (offline?)", e);
  }
}

/**
 * Called after a user signs in (or on every page load while signed in).
 * NON-DESTRUCTIVE: never deletes local keys. Always pushes local keys that
 * are missing from cloud (so the cloud reflects the union), then overwrites
 * local for keys that exist in cloud (cloud wins for shared keys).
 */
export async function activateSync(userId: string) {
  currentUserId = userId;
  installInterceptors();
  subscribeRealtime(userId);
  notifySyncStatus("syncing");

  const cloudRows = await pullAllFromCloud(userId);
  if (cloudRows === null) {
    // Offline / Supabase unreachable — keep local data only.
    notifySyncStatus("offline");
    return;
  }

  const cloudKeys = new Set(cloudRows.map((r) => r.key));

  // 1. Push any local-only keys up so cloud holds the union (never lose local).
  const toPush: { user_id: string; app: string; key: string; value: any }[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !shouldSync(k) || cloudKeys.has(k)) continue;
    const raw = localStorage.getItem(k);
    if (raw === null) continue;
    let parsed: any = raw;
    try { parsed = JSON.parse(raw); } catch { /* keep string */ }
    toPush.push({ user_id: userId, app: APP_NAME, key: k, value: parsed });
  }
  if (toPush.length > 0) {
    try {
      await (supabase as any)
        .from("kommenszlapf_user_data")
        .upsert(toPush, { onConflict: "user_id,app,key" });
    } catch (e) {
      console.warn("[kommenszlapf-sync] seed push failed (offline?)", e);
    }
  }

  // 2. Merge cloud values into local. Strategy per shape:
  //      - arrays of objects with `id`     → union by id (cloud + local, no loss)
  //      - arrays of primitives            → union (Set), preserves local entries
  //      - plain objects (non-array)       → shallow merge, local wins on conflict
  //      - anything else / missing locally → cloud value adopted
  //    Never overwrites a non-empty local array with an empty cloud array
  //    (that was the "all my tasks just deleted" bug after sign-in).
  const mergedRows: { key: string; value: any }[] = [];
  for (const row of cloudRows) {
    if (row.value === null || row.value === undefined) continue;
    const localRaw = localStorage.getItem(row.key);
    let localParsed: any = undefined;
    if (localRaw !== null) {
      try { localParsed = JSON.parse(localRaw); } catch { localParsed = localRaw; }
    }
    let next: any = row.value;
    if (Array.isArray(row.value) && Array.isArray(localParsed)) {
      // Empty cloud array against non-empty local → keep local entirely.
      if (row.value.length === 0 && localParsed.length > 0) {
        next = localParsed;
      } else {
        const cloudArr = row.value;
        const localArr = localParsed;
        const hasIds = (arr: any[]) => arr.length > 0 && arr.every(
          (x) => x && typeof x === "object" && "id" in x
        );
        if (hasIds(cloudArr) || hasIds(localArr)) {
          const byId = new Map<any, any>();
          for (const it of cloudArr) if (it && typeof it === "object" && "id" in it) byId.set(it.id, it);
          for (const it of localArr) if (it && typeof it === "object" && "id" in it) byId.set(it.id, it); // local wins
          next = Array.from(byId.values());
        } else {
          next = Array.from(new Set([...cloudArr, ...localArr]));
        }
      }
    } else if (
      row.value && typeof row.value === "object" && !Array.isArray(row.value) &&
      localParsed && typeof localParsed === "object" && !Array.isArray(localParsed)
    ) {
      next = { ...row.value, ...localParsed };
    } else if (Array.isArray(localParsed) && !Array.isArray(row.value)) {
      // Shape mismatch — protect local array from being overwritten by a
      // non-array cloud value (cause of "JSON.parse(...).filter is not a function").
      next = localParsed;
    }
    const serialized = typeof next === "string" ? next : JSON.stringify(next);
    setItemRaw(row.key, serialized);
    mergedRows.push({ key: row.key, value: next });
  }

  // Push back any merged values so cloud reflects the union too.
  if (mergedRows.length > 0) {
    try {
      await (supabase as any)
        .from("kommenszlapf_user_data")
        .upsert(
          mergedRows.map((r) => ({ user_id: userId, app: APP_NAME, key: r.key, value: r.value })),
          { onConflict: "user_id,app,key" }
        );
    } catch (e) {
      console.warn("[kommenszlapf-sync] merge push failed (offline?)", e);
    }
  }

  // Notify the app so React state reloads from the new localStorage values.
  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(new Event("appSettingsUpdated"));

  // Flush any writes made while offline.
  await flushPendingQueue();
  notifySyncStatus("synced");
}

/**
 * Wipe every row of TaskBurst data for the signed-in user in the cloud.
 * Returns true on success, false on failure (offline / not signed in).
 */
export async function wipeAllCloudData(userId: string): Promise<boolean> {
  try {
    const { error } = await (supabase as any)
      .from("kommenszlapf_user_data")
      .delete()
      .eq("user_id", userId)
      .eq("app", APP_NAME);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn("[kommenszlapf-sync] wipe cloud failed", e);
    return false;
  }
}

export function deactivateSync() {
  currentUserId = null;
  unsubscribeRealtime();
  uninstallInterceptors();
}

export function getSyncUserId() {
  return currentUserId;
}