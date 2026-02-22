"use client";

import { useState, useRef, useEffect } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import { PlayArrow, Pause } from "@mui/icons-material";

export default function VoiceMessagePlayer({ src, isMe, sx = {} }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTimeUpdate = () => setCurrentTime(el.currentTime);
    const onLoadedMetadata = () => setDuration(el.duration);
    const onEnded = () => {
      setPlaying(false);
      setCurrentTime(0);
    };
    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("loadedmetadata", onLoadedMetadata);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("loadedmetadata", onLoadedMetadata);
      el.removeEventListener("ended", onEnded);
    };
  }, [src]);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
    } else {
      el.play();
    }
    setPlaying(!playing);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const formatTime = (s) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        minWidth: 200,
        maxWidth: 280,
        py: 0.5,
        ...sx,
      }}
    >
      <audio ref={audioRef} src={src} preload="metadata" />
      <IconButton
        onClick={togglePlay}
        size="small"
        sx={{
          width: 40,
          height: 40,
          bgcolor: isMe ? "rgba(255,255,255,0.25)" : "action.hover",
          color: "inherit",
          flexShrink: 0,
          "&:hover": {
            bgcolor: isMe ? "rgba(255,255,255,0.35)" : "action.selected",
          },
        }}
      >
        {playing ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" sx={{ ml: "2px" }} />}
      </IconButton>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          sx={{
            height: 5,
            borderRadius: 2.5,
            bgcolor: isMe ? "rgba(255,255,255,0.3)" : "action.hover",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              height: "100%",
              width: `${progress}%`,
              borderRadius: 2.5,
              bgcolor: isMe ? "rgba(255,255,255,0.9)" : "primary.main",
              transition: "width 0.12s ease",
            }}
          />
        </Box>
      </Box>
      <Typography
        variant="caption"
        sx={{
          fontSize: "0.7rem",
          opacity: 0.9,
          minWidth: 36,
          textAlign: "left",
        }}
      >
        {playing ? formatTime(currentTime) + " / " + formatTime(duration) : formatTime(duration || 0)}
      </Typography>
    </Box>
  );
}
