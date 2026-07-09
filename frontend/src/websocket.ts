import { useEffect, useRef } from 'react';
import { WS_BASE_URL } from './config';

type WebSocketCallback = (type: string, data: any) => void;

export function useWebSocket(
  onEvent: WebSocketCallback,
  onStatusChange?: (connected: boolean) => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const retryCountRef = useRef<number>(0);

  // Use refs to store latest callbacks to avoid stale closures in event listeners
  const onEventRef = useRef(onEvent);
  const onStatusChangeRef = useRef(onStatusChange);

  useEffect(() => {
    onEventRef.current = onEvent;
    onStatusChangeRef.current = onStatusChange;
  }, [onEvent, onStatusChange]);

  const connect = () => {
    // Clear any existing connection first
    if (wsRef.current) {
      try {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
      } catch (e) {
        // ignore
      }
    }

    const wsUrl = `${WS_BASE_URL}/api/ws`;
    console.log(`Connecting to WebSocket: ${wsUrl}`);
    
    const scheduleReconnection = () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      // Bounded delay: exponential backoff starting at 1s, doubling up to a max of 16s
      const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 16000);
      console.log(`Scheduling WebSocket reconnection in ${delay}ms (attempt ${retryCountRef.current + 1})`);
      reconnectTimeoutRef.current = window.setTimeout(() => {
        retryCountRef.current += 1;
        connect();
      }, delay);
    };

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connection established.');
        retryCountRef.current = 0; // Reset retries on successful connection
        ws.send('ping');
        onStatusChangeRef.current?.(true);
      };

      ws.onmessage = (event) => {
        if (event.data === 'ping' || event.data.startsWith('ACK')) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload && payload.type) {
            onEventRef.current(payload.type, payload.data);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onclose = (event) => {
        console.log(`WebSocket connection closed (code: ${event.code}).`);
        onStatusChangeRef.current?.(false);
        scheduleReconnection();
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        onStatusChangeRef.current?.(false);
        // Closing the socket will trigger onclose, which handles reconnection.
        // If the state is not closed or closing, close it manually.
        try {
          if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
            ws.close();
          } else {
            // If it never managed to start, trigger reconnection here
            scheduleReconnection();
          }
        } catch (e) {
          scheduleReconnection();
        }
      };
    } catch (error) {
      console.error('Error during WebSocket initialization:', error);
      onStatusChangeRef.current?.(false);
      scheduleReconnection();
    }
  };

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        try {
          wsRef.current.close();
        } catch (e) {
          // ignore
        }
      }
      onStatusChangeRef.current?.(false);
    };
  }, []);

  const sendEvent = (type: string, data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type, data }));
      } catch (error) {
        console.error('Error sending WebSocket event:', error);
      }
    } else {
      console.warn('WebSocket not connected. Cannot send event:', type);
    }
  };

  return { sendEvent };
}
