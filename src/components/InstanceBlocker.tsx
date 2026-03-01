import { useState, useEffect, useRef } from 'react';

const CHANNEL_NAME = 'taskburst-instance';
const HEARTBEAT_KEY = 'taskburst-heartbeat';
const HEARTBEAT_INTERVAL = 2000; // 2 seconds
const HEARTBEAT_TIMEOUT = 5000; // 5 seconds - consider dead after this
const INSTANCE_ID_KEY = 'taskburst-instance-id';

export const InstanceBlocker = ({ children }: { children: React.ReactNode }) => {
  const [blocked, setBlocked] = useState(false);
  const instanceId = useRef(`${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const heartbeatRef = useRef<number>();

  useEffect(() => {
    // Check if another instance is alive via localStorage heartbeat
    const checkExisting = () => {
      const stored = localStorage.getItem(HEARTBEAT_KEY);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          if (data.id !== instanceId.current && Date.now() - data.timestamp < HEARTBEAT_TIMEOUT) {
            return true; // Another instance is alive
          }
        } catch { }
      }
      return false;
    };

    if (checkExisting()) {
      setBlocked(true);
      // Keep checking if the other instance dies
      const checkInterval = window.setInterval(() => {
        if (!checkExisting()) {
          setBlocked(false);
          clearInterval(checkInterval);
          startHeartbeat();
        }
      }, HEARTBEAT_INTERVAL);
      return () => clearInterval(checkInterval);
    }

    // BroadcastChannel for instant detection
    try {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channelRef.current = channel;

      channel.onmessage = (event) => {
        if (event.data.type === 'ping' && event.data.id !== instanceId.current) {
          // Another instance opened - reply with our presence
          channel.postMessage({ type: 'pong', id: instanceId.current });
        }
        if (event.data.type === 'pong' && event.data.id !== instanceId.current) {
          // We got blocked - another instance was here first
          // Only block if we're newer
        }
        if (event.data.type === 'new-instance' && event.data.id !== instanceId.current) {
          // A new instance opened, it should be blocked, not us
        }
      };

      // Announce ourselves
      channel.postMessage({ type: 'ping', id: instanceId.current });
    } catch {
      // BroadcastChannel not supported, fall back to localStorage only
    }

    const startHeartbeat = () => {
      // Write heartbeat immediately
      const writeHeartbeat = () => {
        localStorage.setItem(HEARTBEAT_KEY, JSON.stringify({
          id: instanceId.current,
          timestamp: Date.now(),
        }));
      };
      writeHeartbeat();
      heartbeatRef.current = window.setInterval(writeHeartbeat, HEARTBEAT_INTERVAL);
    };

    startHeartbeat();

    // Listen for storage events from other tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === HEARTBEAT_KEY && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data.id !== instanceId.current) {
            setBlocked(true);
          }
        } catch { }
      }
    };

    window.addEventListener('storage', handleStorage);

    // Cleanup on unmount
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      channelRef.current?.close();
      window.removeEventListener('storage', handleStorage);
      // Clear heartbeat so other tabs can start
      const stored = localStorage.getItem(HEARTBEAT_KEY);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          if (data.id === instanceId.current) {
            localStorage.removeItem(HEARTBEAT_KEY);
          }
        } catch { }
      }
    };
  }, []);

  if (blocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="max-w-md text-center space-y-4">
          <div className="text-6xl">⚠️</div>
          <h1 className="text-2xl font-bold text-foreground">TaskBurst Already Open</h1>
          <p className="text-muted-foreground">
            Another instance of TaskBurst is already open in this browser.
            Please close all other TaskBurst tabs/windows before using this one.
          </p>
          <p className="text-sm text-muted-foreground">
            This prevents data conflicts with localStorage.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
