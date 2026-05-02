import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker (skip in iframe/preview to avoid stale caches)
if ("serviceWorker" in navigator) {
  const inIframe = (() => {
    try { return window.self !== window.top; } catch { return true; }
  })();
  const previewHost =
    location.hostname.includes("id-preview--") ||
    location.hostname.includes("lovableproject.com") ||
    location.hostname.includes("lovable.app");

  if (inIframe || previewHost) {
    navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
  } else {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }
}
