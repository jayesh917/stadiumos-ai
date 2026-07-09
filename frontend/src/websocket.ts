import { useEffect, useRef } from 'react';

type WebSocketCallback = (type: string, data: any) => void;

export function useWebSocket(onEvent: WebSocketCallback) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const connect = () => {
    const wsUrl = `ws://${window.location.hostname}:8000/api/ws`;
    console.log(`Connecting to WebSocket: ${wsUrl}`);
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connection established.');
      ws.send('ping');
    };

    ws.onmessage = (event) => {
      if (event.data === 'ping' || event.data.startsWith('ACK')) return;
      try {
        const payload = JSON.parse(event.data);
        if (payload && payload.type) {
          onEvent(payload.type, payload.data);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onclose = (event) => {
      console.log(`WebSocket connection closed (code: ${event.code}). Reconnecting in 3s...`);
      // Prevent multiple reconnection triggers
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      ws.close();
    };
  };

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // Clear handler to avoid reconnection
        wsRef.current.close();
      }
    };
  }, []);

  const sendEvent = (type: string, data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }));
    } else {
      console.warn('WebSocket not connected. Cannot send event:', type);
    }
  };

  return { sendEvent };
}
