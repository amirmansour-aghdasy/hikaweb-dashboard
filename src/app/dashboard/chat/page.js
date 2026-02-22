"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  Drawer,
} from "@mui/material";
import { Send, Add, Chat as ChatIcon, Menu as MenuIcon, ArrowBack, Mic, Stop } from "@mui/icons-material";
import Layout from "@/components/layout/Layout";
import { useApi } from "@/hooks/useApi";
import { useChatSocket } from "@/hooks/useChatSocket";
import { useAuthStore } from "@/store/useAuthStore";
import api from "@/lib/api";
import { format } from "date-fns";
import { faIR } from "date-fns/locale";
import VoiceMessagePlayer from "@/components/chat/VoiceMessagePlayer";

export default function ChatPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { user } = useAuthStore();
  const currentUserId = user?._id || user?.id;

  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [typingUserIds, setTypingUserIds] = useState(new Set());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [roomMembers, setRoomMembers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  const { useFetchData } = useApi();
  const {
    connected,
    joinRoom,
    leaveRoom,
    sendMessage,
    typingStart,
    typingStop,
    onNewMessage,
    onTyping,
    onRoomMembers,
  } = useChatSocket();

  const { data: roomsData, refetch: refetchRooms } = useFetchData("chat-rooms", "/chat/rooms");

  useEffect(() => {
    if (roomsData?.data?.rooms) {
      setRooms(roomsData.data.rooms);
      if (!selectedRoomId && roomsData.data.rooms.length > 0) {
        setSelectedRoomId(roomsData.data.rooms[0]._id);
      }
    }
    setLoadingRooms(false);
  }, [roomsData]);

  const fetchMessages = useCallback(async (roomId) => {
    if (!roomId) return;
    setLoadingMessages(true);
    try {
      const res = await api.get(`/chat/rooms/${roomId}/messages?limit=100`);
      if (res.data?.data?.messages) {
        setMessages(res.data.data.messages);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (selectedRoomId) {
      setRoomMembers([]);
      fetchMessages(selectedRoomId);
      joinRoom(selectedRoomId, (r) => {
        if (!r?.ok) console.warn("Join room failed", r);
      });
    }
    return () => {
      if (selectedRoomId) leaveRoom(selectedRoomId);
    };
  }, [selectedRoomId, joinRoom, leaveRoom, fetchMessages]);

  useEffect(() => {
    const unsub = onRoomMembers(({ roomId, members }) => {
      if (String(roomId) === String(selectedRoomId)) setRoomMembers(members || []);
    });
    return unsub;
  }, [onRoomMembers, selectedRoomId]);

  useEffect(() => {
    const unsub = onNewMessage((msg) => {
      if (msg?.room === selectedRoomId) {
        setMessages((prev) => [...prev, msg]);
      }
    });
    return unsub;
  }, [onNewMessage, selectedRoomId]);

  useEffect(() => {
    const unsub = onTyping(({ roomId, userId, typing }) => {
      if (roomId !== selectedRoomId) return;
      setTypingUserIds((prev) => {
        const next = new Set(prev);
        if (typing) next.add(userId);
        else next.delete(userId);
        return next;
      });
    });
    return unsub;
  }, [onTyping, selectedRoomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || !selectedRoomId) return;
    sendMessage(selectedRoomId, text, (res) => {
      if (res?.ok) setInputText("");
    });
  };

  const startVoiceRecording = async () => {
    if (!selectedRoomId || !connected) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const chunks = [];
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (chunks.length === 0) return;
        const blob = new Blob(chunks, { type: "audio/webm;codecs=opus" });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result?.split(",")[1];
          if (base64) sendMessage(selectedRoomId, "", (res) => {}, base64);
        };
        reader.readAsDataURL(blob);
      };
      recorder.start();
      setRecording(true);
    } catch (e) {
      console.error("Voice recording failed", e);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setRecording(false);
    }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!selectedRoomId) return;
    typingStart(selectedRoomId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      typingStop(selectedRoomId);
    }, 2000);
  };

  const handleCreateRoom = async () => {
    const name = newRoomName.trim();
    if (!name) return;
    try {
      await api.post("/chat/rooms", { name });
      setNewRoomName("");
      setCreateDialogOpen(false);
      refetchRooms();
    } catch (e) {
      console.error(e);
    }
  };

  const selectedRoom = rooms.find((r) => r._id === selectedRoomId);

  const isMyMessage = (msg) => {
    const senderId = msg.sender?._id || msg.sender?.id;
    return senderId && String(senderId) === String(currentUserId);
  };

  const roomListContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minWidth: 260 }}>
      <Box
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          اتاق‌ها
        </Typography>
        <IconButton
          size="small"
          onClick={() => {
            setCreateDialogOpen(true);
            if (isMobile) setSidebarOpen(false);
          }}
          title="اتاق جدید"
          sx={{ bgcolor: "action.hover" }}
        >
          <Add />
        </IconButton>
      </Box>
      {loadingRooms ? (
        <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <List dense sx={{ overflow: "auto", flex: 1, py: 0 }}>
          {rooms.length === 0 ? (
            <ListItemButton disabled sx={{ opacity: 0.8 }}>
              <ListItemText
                primary="اتاقی وجود ندارد"
                secondary="با دکمه + اتاق جدید بسازید"
                primaryTypographyProps={{ variant: "body2" }}
              />
            </ListItemButton>
          ) : (
            rooms.map((room) => (
              <ListItemButton
                key={room._id}
                selected={room._id === selectedRoomId}
                onClick={() => {
                  setSelectedRoomId(room._id);
                  if (isMobile) setSidebarOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  mt: 0.5,
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    "&:hover": { bgcolor: "primary.dark" },
                  },
                }}
              >
                <ListItemText
                  primary={room.name}
                  secondary={room.description || room.slug}
                  primaryTypographyProps={{ fontWeight: 500 }}
                  secondaryTypographyProps={{ variant: "caption", noWrap: true }}
                />
              </ListItemButton>
            ))
          )}
        </List>
      )}
    </Box>
  );

  return (
    <Layout>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: { xs: "100vh", sm: "calc(100vh - 120px)" },
          overflow: "hidden",
          p: { xs: 1, sm: 2 },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mb: 2,
            flexWrap: "wrap",
          }}
        >
          {isMobile && (
            <IconButton
              onClick={() => setSidebarOpen(true)}
              sx={{ display: { md: "none" } }}
              size="small"
            >
              <MenuIcon />
            </IconButton>
          )}
          <ChatIcon sx={{ color: "primary.main", fontSize: 28 }} />
          <Typography variant="h5" fontWeight={600}>
            چت تیم
          </Typography>
          <Chip
            size="small"
            label={connected ? "متصل" : "قطع"}
            color={connected ? "success" : "default"}
            sx={{ fontWeight: 500 }}
          />
        </Box>

        <Box sx={{ display: "flex", flex: 1, minHeight: 0, gap: 2, position: "relative" }}>
          {!isMobile && (
            <Paper
              elevation={0}
              sx={{
                width: 280,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                borderRadius: 3,
                border: 1,
                borderColor: "divider",
              }}
            >
              {roomListContent}
            </Paper>
          )}

          {isMobile && (
            <Drawer
              anchor="right"
              open={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              PaperProps={{
                sx: { width: 280, maxWidth: "85vw", borderRadius: "16px 0 0 16px" },
              }}
            >
              <Box sx={{ height: "100%", pt: 2 }}>{roomListContent}</Box>
            </Drawer>
          )}

          <Paper
            elevation={0}
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              borderRadius: 3,
              border: 1,
              borderColor: "divider",
              minWidth: 0,
            }}
          >
            {!selectedRoom ? (
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "text.secondary",
                  flexDirection: "column",
                  gap: 1,
                }}
              >
                <ChatIcon sx={{ fontSize: 56, opacity: 0.4 }} />
                <Typography>یک اتاق انتخاب کنید</Typography>
                {isMobile && (
                  <Button startIcon={<MenuIcon />} onClick={() => setSidebarOpen(true)} size="small">
                    لیست اتاق‌ها
                  </Button>
                )}
              </Box>
            ) : (
              <>
                <Box
                  sx={{
                    borderBottom: 1,
                    borderColor: "divider",
                  }}
                >
                  <Box
                    sx={{
                      p: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    {isMobile && (
                      <IconButton size="small" onClick={() => setSidebarOpen(true)}>
                        <ArrowBack />
                      </IconButton>
                    )}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {selectedRoom.name}
                      </Typography>
                      {selectedRoom.description && (
                        <Typography variant="caption" color="text.secondary" noWrap display="block">
                          {selectedRoom.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      px: 2,
                      pb: 1.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                      حاضر در اتاق:
                    </Typography>
                    {roomMembers.length === 0 ? (
                      <Typography variant="caption" color="text.secondary">
                        —
                      </Typography>
                    ) : (
                      roomMembers.map((m) => (
                        <Box
                          key={m._id}
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.5,
                            px: 1,
                            py: 0.25,
                            borderRadius: 2,
                            bgcolor: "action.hover",
                          }}
                        >
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              bgcolor: "success.main",
                            }}
                          />
                          <Avatar sx={{ width: 22, height: 22, fontSize: "0.7rem" }}>
                            {(m.name || m.email || "?")[0]}
                          </Avatar>
                          <Typography variant="caption" noWrap sx={{ maxWidth: 90 }}>
                            {m.name || m.email || "ناشناس"}
                          </Typography>
                        </Box>
                      ))
                    )}
                  </Box>
                </Box>

                <List
                  sx={{
                    flex: 1,
                    overflow: "auto",
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                    bgcolor: "grey.50",
                  }}
                >
                  {loadingMessages ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                      <CircularProgress size={32} />
                    </Box>
                  ) : (
                    messages.map((msg) => {
                      const isMe = isMyMessage(msg);
                      return (
                        <Box
                          key={msg._id}
                          sx={{
                            display: "flex",
                            justifyContent: isMe ? "flex-start" : "flex-end",
                            alignSelf: isMe ? "flex-start" : "flex-end",
                            maxWidth: { xs: "95%", sm: "75%" },
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: isMe ? "row-reverse" : "row",
                              alignItems: "flex-end",
                              gap: 1,
                            }}
                          >
                            {!isMe && (
                              <Avatar
                                sx={{
                                  width: 36,
                                  height: 36,
                                  fontSize: "0.875rem",
                                  flexShrink: 0,
                                }}
                              >
                                {(msg.sender?.name || msg.sender?.email || "?")[0]}
                              </Avatar>
                            )}
                            <Paper
                              elevation={0}
                              sx={{
                                px: 1.75,
                                py: 1.25,
                                borderRadius: "18px",
                                borderTopRightRadius: isMe ? 4 : 18,
                                borderTopLeftRadius: isMe ? 18 : 4,
                                bgcolor: isMe ? "primary.main" : "background.paper",
                                color: isMe ? "primary.contrastText" : "text.primary",
                                border: 1,
                                borderColor: isMe ? "transparent" : "divider",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                                maxWidth: 320,
                              }}
                            >
                              {!isMe && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    display: "block",
                                    mb: 0.25,
                                    opacity: 0.95,
                                    fontWeight: 600,
                                    fontSize: "0.75rem",
                                  }}
                                >
                                  {msg.sender?.name || msg.sender?.email || "ناشناس"}
                                </Typography>
                              )}
                              {msg.audio ? (
                                <VoiceMessagePlayer
                                  src={`data:audio/webm;base64,${msg.audio}`}
                                  isMe={isMe}
                                />
                              ) : null}
                              {msg.text ? (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-word",
                                    lineHeight: 1.45,
                                    fontSize: "0.9375rem",
                                  }}
                                >
                                  {msg.text}
                                </Typography>
                              ) : null}
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: isMe ? "flex-start" : "flex-end",
                                  alignItems: "center",
                                  mt: 0.25,
                                  gap: 0.5,
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{
                                    opacity: 0.75,
                                    fontSize: "0.65rem",
                                  }}
                                >
                                  {msg.createdAt &&
                                    format(new Date(msg.createdAt), "HH:mm", {
                                      locale: faIR,
                                    })}
                                </Typography>
                              </Box>
                            </Paper>
                          </Box>
                        </Box>
                      );
                    })
                  )}
                  {typingUserIds.size > 0 && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontStyle: "italic", alignSelf: "flex-start", px: 1 }}
                    >
                      در حال تایپ...
                    </Typography>
                  )}
                  <div ref={messagesEndRef} />
                </List>

                <Box
                  sx={{
                    p: 2,
                    borderTop: 1,
                    borderColor: "divider",
                    display: "flex",
                    gap: 1.5,
                    alignItems: "flex-end",
                    bgcolor: "background.paper",
                  }}
                >
                  <TextField
                    fullWidth
                    multiline
                    minRows={1}
                    maxRows={5}
                    size="small"
                    placeholder="پیام شما... (Enter برای ارسال، Shift+Enter برای خط جدید)"
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    disabled={!connected}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                        bgcolor: "grey.50",
                        alignItems: "flex-end",
                      },
                    }}
                  />
                  <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                    <IconButton
                      color={recording ? "error" : "default"}
                      onClick={recording ? stopVoiceRecording : startVoiceRecording}
                      disabled={!connected}
                      title={recording ? "توقف ضبط" : "ضبط پیام صوتی"}
                    >
                      {recording ? <Stop /> : <Mic />}
                    </IconButton>
                    <Button
                      variant="contained"
                      onClick={handleSend}
                      disabled={!inputText.trim() || !connected}
                      sx={{
                        minWidth: 48,
                        height: 40,
                        borderRadius: 3,
                        px: 2,
                      }}
                    >
                      <Send fontSize="small" />
                    </Button>
                  </Box>
                </Box>
              </>
            )}
          </Paper>
        </Box>
      </Box>

      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>اتاق جدید</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="نام اتاق"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateDialogOpen(false)}>انصراف</Button>
          <Button onClick={handleCreateRoom} variant="contained" disabled={!newRoomName.trim()}>
            ایجاد
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
