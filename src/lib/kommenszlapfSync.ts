import { supabase } from "@/integrations/supabase/client";

const APP_NAME = "taskburst";
const PENDING: Map<string, number> = new Map();
const DEBOUNCE_MS = 600;
let installed = false;
let originalSetItem: typeof Storage.prototype.setItem | null = null;
let originalRemoveItem: typeof Storage.prototype.removeItem | null = null;
let originalClear: typeof Storage.prototype.clear | null = null;
let currentUserId: string | null = null;

const SKIP_PREFIXES = ["sb-", "supabase.", "kommenszlapf:"];
const SKIP_KEYS = new Set<string>([]);

function shouldSync(key: string) {
  if (SKIP_KEYS.has(key)) return false;
  return !SKIP_PREFIXES.some((p) => key.startsWith(p));
}

function scheduleUpsert(key: string) {
  if (!currentUserId) return;
  const existing = PENDING.get(key);
  if (existing) window.clearTimeout(existing);
  const handle = window.setTimeout(() => {
    PENDING.delete(key);
    void flushKey(key);
  }, DEBOUNCE_MS);
  PENDING.set(key, handle);
}

async function flushKey(key: string) {
  if (!currentUserId) return;
  const raw = localStorage.getItem(key);
  try {
    if (raw === null) {
      await (supabase as any)
        .from("kommenszlapf_user_data")
        .delete()
        .eq("user_id", currentUserId)
        .eq("app", APP_NAME)
        .eq("key", key);
    } else {
      let parsed: any = raw;
      try { parsed = JSON.parse(raw); } catch { /* keep string */ }
      await (supabase as any)
        .from("kommenszlapf_user_data")
        .upsert(
          { user_id: currentUserId, app: APP_NAME, key, value: parsed },
          { onConflict: "user_id,app,key" }
        );
    }
  } catch (e) {
    // Silently swallow — fall back to localStorage-only behaviour.
    console.warn("[kommenszlapf-sync] flush failed (offline?)", key, e);
  }
}

function installInterceptors() {
  if (installed) return;
  installed = true;
  originalSetItem = Storage.prototype.setItem;
  originalRemoveItem = Storage.prototype.removeItem;
  originalClear = Storage.prototype.clear;

  Storage.prototype.setItem = function (key: string, value: string) {
    originalSetItem!.call(this, key, value);
    if (this === window.localStorage && shouldSync(key)) scheduleUpsert(key);
  };
  Storage.prototype.removeItem = function (key: string) {
    originalRemoveItem!.call(this, key);
    if (this === window.localStorage && shouldSync(key)) scheduleUpsert(key);
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
    keys.forEach(scheduleUpsert);
  };
}

function uninstallInterceptors() {
  if (!installed) return;
  if (originalSetItem) Storage.prototype.setItem = originalSetItem;
  if (originalRemoveItem) Storage.prototype.removeItem = originalRemoveItem;
  if (originalClear) Storage.prototype.clear = originalClear;
  installed = false;
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

  const cloudRows = await pullAllFromCloud(userId);
  if (cloudRows === null) {
    // Offline / Supabase unreachable — keep local data only.
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
  PENDING.forEach((h) => window.clearTimeout(h));
  PENDING.clear();
  uninstallInterceptors();
}

export function getSyncUserId() {
  return currentUserId;
}