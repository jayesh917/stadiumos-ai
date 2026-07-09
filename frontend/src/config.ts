const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const API_BASE_URL = apiBase;

export const WS_BASE_URL = import.meta.env.VITE_WS_URL || (() => {
  try {
    const url = new URL(apiBase);
    if (url.protocol === "https:") {
      url.protocol = "wss:";
    } else if (url.protocol === "http:") {
      url.protocol = "ws:";
    }
    return url.toString().replace(/\/$/, "");
  } catch (e) {
    return "ws://localhost:8000";
  }
})();
