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
 * Called after a user signs in. If `mergeLocal` is true (first time they
 * sign in on this device and have existing local data), push local up first
 * unless cloud already has rows — cloud always wins on conflict.
 */
export async function activateSync(userId: string) {
  currentUserId = userId;
  installInterceptors();

  const cloudRows = await pullAllFromCloud(userId);
  if (cloudRows === null) {
    // Offline / Supabase unreachable — keep local data only.
    return;
  }

  if (cloudRows.length === 0) {
    // First sign-in on this account: seed cloud with current local data.
    await pushAllLocalToCloud(userId);
  } else {
    // Replace local app data with cloud data.
    const cloudKeys = new Set(cloudRows.map((r) => r.key));
    // Remove local keys that aren't in cloud (so device matches account).
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && shouldSync(k) && !cloudKeys.has(k)) toRemove.push(k);
    }
    toRemove.forEach((k) => removeItemRaw(k));
    for (const row of cloudRows) {
      const serialized =
        typeof row.value === "string" ? row.value : JSON.stringify(row.value);
      setItemRaw(row.key, serialized);
    }
    // Notify the app so React state reloads from the new localStorage values.
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("appSettingsUpdated"));
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