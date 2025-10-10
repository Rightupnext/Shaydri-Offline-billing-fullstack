import { useEffect, useRef, useState } from "react";

const useWebSocket = (dbName, deviceId) => {
  const socketRef = useRef(null);
  const [scannedProduct, setScannedProduct] = useState(null);

  useEffect(() => {
    if (!dbName || !deviceId) return;

    const wsUrl = `ws://localhost:5001?dbName=${dbName}&deviceId=${deviceId}`;
    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onopen = () => {
      console.log("✅ WebSocket connected");
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.event === "scanned_product") {
        setScannedProduct(data.product);
        // console.log("📦 Received scanned product:", data.product);
      }
    };

    socketRef.current.onclose = () => {
      console.log("❌ WebSocket disconnected");
    };

    socketRef.current.onerror = (err) => {
      console.error("⚠️ WebSocket error:", err);
    };

    return () => {
      socketRef.current?.close();
    };
  }, [dbName, deviceId]);

  return { scannedProduct };
};

export default useWebSocket;
