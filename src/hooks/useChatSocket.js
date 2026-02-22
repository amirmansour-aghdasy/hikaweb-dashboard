"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import Cookies from "js-cookie";

const getSocketUrl = () => {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  return base.replace(/\/api\/v1\/?$/, "");
};

export function useChatSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) return;

    const url = getSocketUrl();
    const socket = io(url, {
      path: "/socket.io",
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));

    socketRef.current = socket;
    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, []);

  const joinRoom = useCallback((roomId, cb) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("chat:join", roomId, cb || (() => {}));
    } else if (typeof cb === "function") {
      cb({ ok: false, error: "اتصال برقرار نیست" });
    }
  }, []);

  const leaveRoom = useCallback((roomId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("chat:leave", roomId);
    }
  }, []);

  const sendMessage = useCallback((roomId, text, cb, audio) => {
    if (socketRef.current?.connected) {
      const payload = { roomId, text: text != null ? String(text) : "" };
      if (audio) payload.audio = audio;
      socketRef.current.emit("chat:message", payload, cb || (() => {}));
    } else if (typeof cb === "function") {
      cb({ ok: false, error: "اتصال برقرار نیست" });
    }
  }, []);

  const typingStart = useCallback((roomId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("chat:typing_start", roomId);
    }
  }, []);

  const typingStop = useCallback((roomId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("chat:typing_stop", roomId);
    }
  }, []);

  const onNewMessage = useCallback((handler) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on("chat:new_message", handler);
    return () => socketRef.current?.off("chat:new_message", handler);
  }, []);

  const onTyping = useCallback((handler) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on("chat:typing", handler);
    return () => socketRef.current?.off("chat:typing", handler);
  }, []);

  const onUserJoined = useCallback((handler) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on("chat:user_joined", handler);
    return () => socketRef.current?.off("chat:user_joined", handler);
  }, []);

  const onUserLeft = useCallback((handler) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on("chat:user_left", handler);
    return () => socketRef.current?.off("chat:user_left", handler);
  }, []);

  const onRoomMembers = useCallback((handler) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on("chat:room_members", handler);
    return () => socketRef.current?.off("chat:room_members", handler);
  }, []);

  return {
    connected,
    joinRoom,
    leaveRoom,
    sendMessage,
    typingStart,
    typingStop,
    onNewMessage,
    onTyping,
    onUserJoined,
    onUserLeft,
    onRoomMembers,
  };
}
