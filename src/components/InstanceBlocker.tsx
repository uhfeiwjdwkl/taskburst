import { useState, useEffect, useRef } from 'react';

const CHANNEL_NAME = 'taskburst-instance';
const HEARTBEAT_KEY = 'taskburst-heartbeat';
const HEARTBEAT_INTERVAL = 2000;
const HEARTBEAT_TIMEOUT = 6000;

export const InstanceBlocker = ({ children }: { children: React.ReactNode }) => {
  const [blocked, setBlocked] = useState(false);
  const instanceId = useRef(`${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const heartbeatRef = useRef<number>();

  useEffect(() => {
    const checkExisting = (): boolean => {
      const stored = localStorage.getItem(HEARTBEAT_KEY);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          if (data.id !== instanceId.current && Date.now() - data.timestamp < HEARTBEAT_TIMEOUT) {
            return true;
          }
        } catch { }
      }
      return false;
    };

    const writeHeartbeat = () => {
      localStorage.setItem(HEARTBEAT_KEY, JSON.stringify({
        id: instanceId.current,
        timestamp: Date.now(),
      }));
    };

    const startHeartbeat = () => {
      writeHeartbeat();
      heartbeatRef.current = window.setInterval(writeHeartbeat, HEARTBEAT_INTERVAL);
    };

    const cleanupHeartbeat = () => {
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

    if (checkExisting()) {
      setBlocked(true);
      const checkInterval = window.setInterval(() => {
        if (!checkExisting()) {
          setBlocked(false);
          clearInterval(checkInterval);
          startHeartbeat();
        }
      }, HEARTBEAT_INTERVAL);
      return () => clearInterval(checkInterval);
    }

    // We are the primary instance
    startHeartbeat();

    // BroadcastChannel for instant detection
    try {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channelRef.current = channel;

      channel.onmessage = (event) => {
        if (event.data.type === 'ping' && event.data.id !== instanceId.current) {
          // Another instance is asking if anyone is alive - respond
          channel.postMessage({ type: 'pong', id: instanceId.current });
        }
      };

      channel.postMessage({ type: 'ping', id: instanceId.current });
    } catch {
      // BroadcastChannel not supported
    }

    // Clean up on beforeunload so reloads don't false-positive
    const handleBeforeUnload = () => {
      cleanupHeartbeat();
      channelRef.current?.close();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Listen for OTHER tabs writing heartbeats
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

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      channelRef.current?.close();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      cleanupHeartbeat();
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
