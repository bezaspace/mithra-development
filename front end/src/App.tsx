import { useEffect, useMemo, useRef, useState } from "react";
import { Route, Routes, Navigate, useNavigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Alert,
  Fade,
  Container,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Mic as MicIcon,
  Stop as StopIcon,
  InfoOutlined as InfoIcon,
} from "@mui/icons-material";

import { BookingUpdates, type BookingUpdate } from "./components/BookingUpdates";
import { DoctorRecommendations } from "./components/DoctorRecommendations";
import { AdherenceDoughnut } from "./components/dashboard/AdherenceDoughnut";
import { backendHttpUrl, backendWsUrl } from "./lib/backendUrls";
import { startMicCapture, type AudioInputController } from "./lib/audioIn";
import { AudioPlayer } from "./lib/audioOut";
import { LiveSocket, type AdherenceReportSavedEvent, type AdherenceStatsEvent, type DoctorCard, type ServerEvent } from "./lib/liveSocket";
import { SchedulePage } from "./pages/SchedulePage";
import { DashboardPage } from "./pages/DashboardPage";
import { PatientSelectionPage } from "./pages/PatientSelectionPage";
import { PatientProvider, usePatient } from "./PatientContext";
import { dashboardTheme } from "./components/dashboard/dashboardTheme";
import { Layout } from "./components/Layout";

type ConnectionState = "idle" | "connecting" | "ready" | "error";
type VoiceVisualState = "idle" | "listening" | "holding" | "awaiting" | "speaking" | "error";
type ScheduleSnapshotEvent = Extract<ServerEvent, { type: "schedule_snapshot" }>;

const wsUrl = backendWsUrl;
const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

const withSessionParams = (url: string, userId: string, timezone: string): string => {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}user_id=${encodeURIComponent(userId)}&timezone=${encodeURIComponent(timezone)}`;
};

function AppContent() {
  const [state, setState] = useState<ConnectionState>("idle");
  const [warning, setWarning] = useState("");
  const [visualState, setVisualState] = useState<VoiceVisualState>("idle");
  const [symptomsSummary, setSymptomsSummary] = useState("");
  const [recommendedDoctors, setRecommendedDoctors] = useState<DoctorCard[]>([]);
  const [bookingUpdates, setBookingUpdates] = useState<BookingUpdate[]>([]);
  const [isPttActive, setIsPttActive] = useState(false);
  const [liveScheduleSnapshot, setLiveScheduleSnapshot] = useState<ScheduleSnapshotEvent | null>(null);
  const [latestAdherenceEvent, setLatestAdherenceEvent] = useState<AdherenceReportSavedEvent | null>(null);
  const [adherenceStats, setAdherenceStats] = useState<AdherenceStatsEvent | null>(null);

  const { userId } = usePatient();
  const navigate = useNavigate();

  const socket = useMemo(() => new LiveSocket(), []);
  const playerRef = useRef<AudioPlayer | null>(null);
  const micRef = useRef<AudioInputController | null>(null);
  const assistantSampleRateRef = useRef<number>(24000);
  const speakingTimeoutRef = useRef<number | null>(null);
  const isPttActiveRef = useRef(false);
  const pttSeqRef = useRef(0);
  const pendingCloseStateRef = useRef<{ state: ConnectionState; visualState: VoiceVisualState; warning: string } | null>(
    null
  );

  const logUi = (message: string, payload?: unknown) => {
    if (payload === undefined) {
      console.info(`[raksha.ui] ${message}`);
      return;
    }
    console.info(`[raksha.ui] ${message}`, payload);
  };

  useEffect(() => {
    return () => {
      if (speakingTimeoutRef.current !== null) {
        window.clearTimeout(speakingTimeoutRef.current);
      }
    };
  }, []);

  const setListeningVisual = () => {
    setVisualState("listening");
  };

  const stopAssistantPlaybackNow = () => {
    logUi("ASSISTANT_PLAYBACK_INTERRUPT");
    playerRef.current?.interruptNow();
    if (speakingTimeoutRef.current !== null) {
      window.clearTimeout(speakingTimeoutRef.current);
      speakingTimeoutRef.current = null;
    }
  };

  const markPttActive = (active: boolean) => {
    isPttActiveRef.current = active;
    setIsPttActive(active);
  };

  const scheduleListeningVisual = (delayMs: number) => {
    if (speakingTimeoutRef.current !== null) {
      window.clearTimeout(speakingTimeoutRef.current);
    }
    speakingTimeoutRef.current = window.setTimeout(() => {
      if (!isPttActiveRef.current) {
        setListeningVisual();
      }
      speakingTimeoutRef.current = null;
    }, delayMs);
  };

  const connect = async () => {
    if (!userId) return;
    logUi("SESSION_CONNECT_START");
    pendingCloseStateRef.current = null;
    setState("connecting");
    setVisualState("idle");
    setWarning("");
    setSymptomsSummary("");
    setRecommendedDoctors([]);
    setBookingUpdates([]);
    setLiveScheduleSnapshot(null);
    setLatestAdherenceEvent(null);
    setAdherenceStats(null);
    markPttActive(false);
    assistantSampleRateRef.current = 24000;

    playerRef.current = new AudioPlayer();
    socket.connect(withSessionParams(wsUrl, userId, browserTimezone), {
      onOpen: () => {
        logUi("SESSION_SOCKET_OPEN");
      },
      onClose: () => {
        logUi("SESSION_CLOSED");
        markPttActive(false);
        const pendingCloseState = pendingCloseStateRef.current;
        pendingCloseStateRef.current = null;
        if (pendingCloseState) {
          setState(pendingCloseState.state);
          setVisualState(pendingCloseState.visualState);
          setWarning(pendingCloseState.warning);
          return;
        }
        setState("idle");
        setVisualState("idle");
      },
      onError: () => {
        logUi("SESSION_ERROR");
        setWarning("Connection error. Check backend logs.");
        setState("error");
        setVisualState("error");
        markPttActive(false);
      },
      onEvent: (evt) => {
        logUi("SERVER_EVENT", { type: evt.type });
        if (evt.type === "session_ready") {
          setState("ready");
          setWarning("");
          if (!isPttActiveRef.current) {
            setListeningVisual();
          }
          return;
        }
        if (evt.type === "profile_status") {
          setWarning(evt.message);
          return;
        }
        if (evt.type === "partial_transcript") {
          return;
        }
        if (evt.type === "assistant_text") {
          if (!isPttActiveRef.current) {
            setVisualState("speaking");
            scheduleListeningVisual(1200);
          }
          return;
        }
        if (evt.type === "warning") {
          setWarning(evt.message);
          return;
        }
        if (evt.type === "fallback_started") {
          setWarning("Recovering your previous request after live tool interruption...");
          setVisualState("awaiting");
          return;
        }
        if (evt.type === "fallback_completed") {
          setWarning(
            evt.result === "ok"
              ? "Recovered your request. Reconnecting voice session..."
              : "Could not recover automatically. Please repeat your request."
          );
          return;
        }
        if (evt.type === "session_recovering") {
          setVisualState("awaiting");
          return;
        }
        if (evt.type === "error") {
          setWarning(evt.message);
          return;
        }
        if (evt.type === "assistant_audio_format") {
          assistantSampleRateRef.current = evt.sampleRate;
          return;
        }
        if (evt.type === "assistant_interrupted") {
          stopAssistantPlaybackNow();
          if (!isPttActiveRef.current) {
            setVisualState("awaiting");
          }
          return;
        }
        if (evt.type === "doctor_recommendations") {
          setSymptomsSummary(evt.symptomsSummary);
          setRecommendedDoctors(evt.doctors);
          return;
        }
        if (evt.type === "booking_update") {
          setBookingUpdates((prev) => [...prev, { status: evt.status, message: evt.message, booking: evt.booking }]);
          return;
        }
        if (evt.type === "schedule_snapshot") {
          setLiveScheduleSnapshot(evt);
          return;
        }
        if (evt.type === "adherence_report_saved") {
          if (!evt.saved) {
            setWarning(evt.message || "Could not save adherence report.");
            return;
          }
          setLatestAdherenceEvent(evt);
        }
        if (evt.type === "adherence_stats") {
          setAdherenceStats(evt);
          return;
        }
      },
      onAudioChunk: (chunk) => {
        logUi("AUDIO_RX_CHUNK", { bytes: chunk.byteLength });
        playerRef.current?.playPcm16Chunk(chunk, assistantSampleRateRef.current);
        if (!isPttActiveRef.current) {
          setVisualState("speaking");
        }
        scheduleListeningVisual(280);
      },
    });

    try {
      micRef.current = await startMicCapture((chunk) => {
        socket.sendAudioChunk(chunk);
      });
      micRef.current.pauseStream();
      logUi("MIC_READY");
    } catch (error) {
      logUi("MIC_UNAVAILABLE", error);
      pendingCloseStateRef.current = {
        state: "error",
        visualState: "error",
        warning: "Microphone unavailable.",
      };
      micRef.current?.stop();
      micRef.current = null;
      socket.disconnect();
      if (playerRef.current) {
        await playerRef.current.close();
        playerRef.current = null;
      }
      setWarning("Microphone unavailable.");
      setVisualState("error");
      setState("error");
    }
  };

  const disconnect = async () => {
    pendingCloseStateRef.current = null;
    if (isPttActiveRef.current) {
      logUi("PTT_END_ON_DISCONNECT");
      markPttActive(false);
      micRef.current?.pauseStream();
      logUi("MIC_PAUSE");
      socket.sendEvent({ type: "ptt_end" });
    }
    if (speakingTimeoutRef.current !== null) {
      window.clearTimeout(speakingTimeoutRef.current);
      speakingTimeoutRef.current = null;
    }
    micRef.current?.pauseStream();
    logUi("MIC_PAUSE");
    micRef.current?.stop();
    logUi("MIC_STOP");
    micRef.current = null;
    socket.disconnect();
    if (playerRef.current) {
      await playerRef.current.close();
      playerRef.current = null;
      logUi("AUDIO_PLAYER_CLOSED");
    }
    setState("idle");
    setVisualState("idle");
  };

  const beginPtt = () => {
    if (state !== "ready" || isPttActiveRef.current) return;
    pttSeqRef.current += 1;
    logUi("PTT_BEGIN", { turn: pttSeqRef.current });
    stopAssistantPlaybackNow();
    markPttActive(true);
    setVisualState("holding");
    micRef.current?.startStream();
    logUi("MIC_START");
    socket.sendEvent({ type: "ptt_start" });
  };

  const endPtt = () => {
    if (!isPttActiveRef.current) return;
    logUi("PTT_END", { turn: pttSeqRef.current });
    markPttActive(false);
    micRef.current?.pauseStream();
    logUi("MIC_PAUSE");
    socket.sendEvent({ type: "ptt_end" });
    if (state === "ready") {
      setVisualState("awaiting");
    }
  };

  if (!userId) {
    return (
      <Routes>
        <Route path="/select-patient" element={<PatientSelectionPage />} />
        <Route path="*" element={<Navigate to="/select-patient" replace />} />
      </Routes>
    );
  }

  return (
    <Layout connectionState={state}>
      <Routes>
        <Route
          path="/"
          element={
            <VoiceSessionPage
              state={state}
              visualState={visualState}
              warning={warning}
              symptomsSummary={symptomsSummary}
              recommendedDoctors={recommendedDoctors}
              bookingUpdates={bookingUpdates}
              adherenceStats={adherenceStats}
              isPttActive={isPttActive}
              onConnect={connect}
              onDisconnect={disconnect}
              onBeginPtt={beginPtt}
              onEndPtt={endPtt}
            />
          }
        />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route
          path="/schedule"
          element={
            <SchedulePage
              backendHttpUrl={backendHttpUrl}
              userId={userId}
              liveSnapshot={liveScheduleSnapshot}
              liveReportUpdate={latestAdherenceEvent}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={dashboardTheme}>
      <PatientProvider>
        <AppContent />
      </PatientProvider>
    </ThemeProvider>
  );
}

function VoiceSessionPage({
  state,
  visualState,
  warning,
  symptomsSummary,
  recommendedDoctors,
  bookingUpdates,
  adherenceStats,
  isPttActive,
  onConnect,
  onDisconnect,
  onBeginPtt,
  onEndPtt,
}: {
  state: ConnectionState;
  visualState: VoiceVisualState;
  warning: string;
  symptomsSummary: string;
  recommendedDoctors: DoctorCard[];
  bookingUpdates: BookingUpdate[];
  adherenceStats: AdherenceStatsEvent | null;
  isPttActive: boolean;
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  onBeginPtt: () => void;
  onEndPtt: () => void;
}) {
  const statusText =
    state === "connecting"
      ? "Connecting..."
      : state === "error"
        ? "Connection error"
        : isPttActive
          ? "Listening..."
          : visualState === "speaking"
            ? "Speaking..."
            : visualState === "awaiting"
              ? "Processing..."
              : "Ready";

  return (
    <Box sx={{ 
      position: "relative", 
      height: "calc(100vh - 64px)", // Only subtract bottom nav/spacing
      display: "flex", 
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden"
    }}>
      {/* Dynamic Background Content - only shown if exists */}
      <Box sx={{ 
        flexGrow: 1, 
        width: "100%", 
        overflowY: "auto", 
        pb: 12,
        px: { xs: 2, md: 4 },
        display: "flex",
        flexDirection: "column",
        gap: 3,
        maskImage: "linear-gradient(to bottom, black 80%, transparent 100%)"
      }}>
        {adherenceStats && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: 4,
            }}
          >
            <AdherenceDoughnut adherence={adherenceStats.overallAdherence} size={160} />
            {adherenceStats.todayTotal > 0 && (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: "text.secondary", 
                  textAlign: "center", 
                  mt: 2,
                  fontWeight: 500 
                }}
              >
                Today: {adherenceStats.todayCompleted}/{adherenceStats.todayTotal} activities completed
              </Typography>
            )}
          </Paper>
        )}
        {recommendedDoctors.length > 0 && (
          <DoctorRecommendations symptomsSummary={symptomsSummary} doctors={recommendedDoctors} />
        )}
        {bookingUpdates.length > 0 && (
          <BookingUpdates updates={bookingUpdates} />
        )}
      </Box>

      {/* Floating Status & Controls at Bottom */}
      <Box sx={{ 
        position: "absolute", 
        bottom: 24, 
        left: "50%", 
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        width: "100%",
        maxWidth: 400,
        zIndex: 10
      }}>
        {warning && (
          <Fade in={!!warning}>
            <Alert 
              severity="warning" 
              icon={<InfoIcon sx={{ fontSize: 16 }} />}
              sx={{ 
                borderRadius: 999, 
                bgcolor: "rgba(242, 208, 138, 0.15)", 
                color: "#f2d08a",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(242, 208, 138, 0.3)",
                fontSize: "0.75rem",
                py: 0,
                px: 2
              }}
            >
              {warning}
            </Alert>
          </Fade>
        )}

        <Box sx={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 3,
          bgcolor: "background.paper",
          p: 1.5,
          px: 3,
          borderRadius: 999,
          border: "1px solid",
          borderColor: "rgba(255, 255, 255, 0.05)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          backdropFilter: "blur(12px)"
        }}>
          {state !== "ready" ? (
            <Button
              variant="text"
              color={state === "error" ? "error" : "primary"}
              onClick={state === "idle" || state === "error" ? onConnect : onDisconnect}
              disabled={state === "connecting"}
              sx={{ 
                fontWeight: 700, 
                textTransform: "none", 
                borderRadius: 999,
                fontSize: "0.9rem",
                letterSpacing: 0.5
              }}
            >
              {state === "connecting" ? "Connecting..." : "Start Session"}
            </Button>
          ) : (
            <>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                {statusText}
              </Typography>
              <button
                className={`orb orb-${visualState}`}
                aria-label="Hold to talk"
                onPointerDown={(evt) => {
                  evt.currentTarget.setPointerCapture(evt.pointerId);
                  onBeginPtt();
                }}
                onPointerUp={onEndPtt}
                onPointerCancel={onEndPtt}
                onLostPointerCapture={onEndPtt}
                style={{
                  width: 48,
                  height: 48,
                  borderWidth: 2
                }}
              >
                <span className="orb-core" style={{ width: "50%", height: "50%" }} />
              </button>
              <Button
                variant="text"
                color="inherit"
                onClick={onDisconnect}
                sx={{ 
                  fontWeight: 600, 
                  textTransform: "none", 
                  borderRadius: 999,
                  fontSize: "0.8rem",
                  opacity: 0.5,
                  "&:hover": { opacity: 1 }
                }}
              >
                End
              </Button>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
