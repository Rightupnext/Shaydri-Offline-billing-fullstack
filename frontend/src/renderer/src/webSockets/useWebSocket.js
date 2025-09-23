import { useEffect, useState, useRef } from "react";

const useWebSocket = (serverUrl) => {
  const [scannedData, setScannedData] = useState(null);
  const wsRef = useRef(null);

useEffect(() => {
  if (!serverUrl) return;

  const ws = new WebSocket(serverUrl);
  wsRef.current = ws;

  ws.onopen = () => {
    console.log("✅ WebSocket connected:", serverUrl);
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.event === "scanned_product") {
        // ✅ Always send new object reference to trigger useEffect even if data is the same
        setScannedData({ ...data.product, timestamp: Date.now() });
      }
    } catch (error) {
      console.error("❌ Error parsing WebSocket message:", error);
    }
  };

  ws.onerror = (error) => {
    console.error("❌ WebSocket Error:", error);
  };

  ws.onclose = () => {
    console.log("❌ WebSocket disconnected");
  };

  return () => {
    ws.close();
  };
}, [serverUrl]);


  return scannedData;
};
export default useWebSocket;
