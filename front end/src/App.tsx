import { useEffect, useMemo, useRef, useState } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  Fade,
  Snackbar,
} from "@mui/material";
import { InfoOutlined as InfoIcon, Mic as MicIcon } from "@mui/icons-material";

import { BookingUpdates, type BookingUpdate } from "./components/BookingUpdates";
import { DoctorRecommendations } from "./components/DoctorRecommendations";
import { AdherenceDoughnut } from "./components/dashboard/AdherenceDoughnut";
import { PhysiotherapyScoreChart } from "./components/dashboard/PhysiotherapyScoreChart";
import { PainIndexChart } from "./components/dashboard/PainIndexChart";
import { ActivityCard } from "./components/ActivityCard";
import { backendHttpUrl, backendWsUrl } from "./lib/backendUrls";
import { startMicCapture, type AudioInputController } from "./lib/audioIn";
import { AudioPlayer } from "./lib/audioOut";
import { LiveSocket, type AdherenceReportSavedEvent, type AdherenceStatsEvent, type CurrentActivityEvent, type DoctorCard, type PainIndexEvent, type PhysiotherapyScoreEvent, type ServerEvent } from "./lib/liveSocket";
import { SchedulePage } from "./pages/SchedulePage";
import { DashboardPage } from "./pages/DashboardPage";
import { OverviewPage } from "./pages/OverviewPage";
import { PatientSelectionPage } from "./pages/PatientSelectionPage";
import { PatientProvider, usePatient } from "./PatientContext";
import { dashboardTheme } from "./components/dashboard/dashboardTheme";
import { Layout } from "./components/Layout";

type ConnectionState = "idle" | "connecting" | "ready" | "error";
type VoiceVisualState = "idle" | "listening" | "holding" | "awaiting" | "speaking" | "error";
type ScheduleSnapshotEvent = Extract<ServerEvent, { type: "schedule_snapshot" }>;

// Single-slot visual shown on the voice session page. Only one of these is ever
// displayed at a time; each new tool response from the agent replaces the prior
// visual, giving the "focus on one thing at a time" UX.
type ActiveVisual =
  | { kind: "adherence"; data: AdherenceStatsEvent }
  | { kind: "physiotherapy"; data: PhysiotherapyScoreEvent }
  | { kind: "pain"; data: PainIndexEvent }
  | { kind: "currentActivity"; data: CurrentActivityEvent }
  | { kind: "doctors"; data: { symptomsSummary: string; doctors: DoctorCard[] } }
  | { kind: "booking"; data: BookingUpdate }
  | null;

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
  const [isPttActive, setIsPttActive] = useState(false);
  const [liveScheduleSnapshot, setLiveScheduleSnapshot] = useState<ScheduleSnapshotEvent | null>(null);
  const [latestAdherenceEvent, setLatestAdherenceEvent] = useState<AdherenceReportSavedEvent | null>(null);
  // Single-slot visual shown on the voice session page. Any new visual-bearing
  // server event replaces the previous one, so only one UI ever shows at a time.
  const [activeVisual, setActiveVisual] = useState<ActiveVisual>(null);
  // Retained separately so the adherence toast can resolve activity titles.
  const [currentActivityTitle, setCurrentActivityTitle] = useState<string | null>(null);

  const { userId, setUserId, publishAdherenceEvent } = usePatient();

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
    setActiveVisual(null);
    setCurrentActivityTitle(null);
    setLiveScheduleSnapshot(null);
    setLatestAdherenceEvent(null);
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
          setActiveVisual({
            kind: "doctors",
            data: { symptomsSummary: evt.symptomsSummary, doctors: evt.doctors },
          });
          return;
        }
        if (evt.type === "booking_update") {
          setActiveVisual({
            kind: "booking",
            data: { status: evt.status, message: evt.message, booking: evt.booking },
          });
          return;
        }
        if (evt.type === "schedule_snapshot") {
          setLiveScheduleSnapshot(evt);
          return;
        }
        if (evt.type === "adherence_report_saved") {
          // Always publish to context so the voice-page Snackbar and the
          // Dashboard auto-refresh both react, regardless of success/failure.
          publishAdherenceEvent(evt);
          if (!evt.saved) {
            setWarning(evt.message || "Could not save adherence report.");
            return;
          }
          setLatestAdherenceEvent(evt);
          return;
        }
        if (evt.type === "adherence_stats") {
          setActiveVisual({ kind: "adherence", data: evt });
          return;
        }
        if (evt.type === "physiotherapy_score") {
          setActiveVisual({ kind: "physiotherapy", data: evt });
          return;
        }
        if (evt.type === "pain_index") {
          setActiveVisual({ kind: "pain", data: evt });
          return;
        }
        if (evt.type === "current_activity") {
          setActiveVisual({ kind: "currentActivity", data: evt });
          setCurrentActivityTitle(
            evt.currentItem?.title ?? evt.upcomingItem?.title ?? null
          );
          return;
        }
        if (evt.type === "profile_created") {
          // Update the userId when a profile is created
          logUi("PROFILE_CREATED", { user_id: evt.user_id, full_name: evt.full_name });
          setUserId(evt.user_id);
          setWarning(`Profile created for ${evt.full_name}!`);
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
              activeVisual={activeVisual}
              currentActivityTitle={currentActivityTitle}
              isPttActive={isPttActive}
              onConnect={connect}
              onDisconnect={disconnect}
              onBeginPtt={beginPtt}
              onEndPtt={endPtt}
            />
          }
        />
        <Route path="/overview" element={<OverviewPage />} />
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

const ACTIVITY_LABELS: Record<string, string> = {
  diet: "Diet",
  medication: "Medication",
  sleep: "Sleep",
  activity: "Activity",
};

const STATUS_LABELS: Record<string, string> = {
  done: "done",
  partial: "partially done",
  skipped: "skipped",
  delayed: "delayed",
};

function formatAdherenceToast(
  event: AdherenceReportSavedEvent,
  fallbackTitle?: string | null
): { severity: "success" | "error"; message: string } {
  if (event.saved) {
    const activity =
      fallbackTitle ||
      ACTIVITY_LABELS[event.activityType] ||
      event.activityType ||
      "Activity";
    const statusLabel = STATUS_LABELS[event.status] || event.status;
    return {
      severity: "success",
      message: `✓ Logged ${activity} as ${statusLabel}${
        event.deduped ? " (already recorded)" : ""
      }`,
    };
  }
  return {
    severity: "error",
    message: `Couldn't log activity: ${event.message || "unknown error"}`,
  };
}

function VoiceSessionPage({
  state,
  visualState,
  warning,
  activeVisual,
  currentActivityTitle,
  isPttActive,
  onConnect,
  onDisconnect,
  onBeginPtt,
  onEndPtt,
}: {
  state: ConnectionState;
  visualState: VoiceVisualState;
  warning: string;
  activeVisual: ActiveVisual;
  currentActivityTitle: string | null;
  isPttActive: boolean;
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  onBeginPtt: () => void;
  onEndPtt: () => void;
}) {
  const { latestAdherenceEvent } = usePatient();
  const [toast, setToast] = useState<{
    severity: "success" | "error";
    message: string;
    key: number;
  } | null>(null);
  const lastToastRef = useRef<AdherenceReportSavedEvent | null>(null);

  useEffect(() => {
    if (!latestAdherenceEvent) return;
    if (latestAdherenceEvent === lastToastRef.current) return;
    lastToastRef.current = latestAdherenceEvent;
    const formatted = formatAdherenceToast(latestAdherenceEvent, currentActivityTitle);
    setToast({ ...formatted, key: Date.now() });
  }, [latestAdherenceEvent, currentActivityTitle]);

  useEffect(() => {
    const handleKeyDown = (evt: KeyboardEvent) => {
      if (evt.key === " " && !evt.repeat) {
        evt.preventDefault();
        const target = evt.target as HTMLElement;
        const isInputFocused = target.tagName === "INPUT" ||
                               target.tagName === "TEXTAREA" ||
                               target.isContentEditable;
        if (!isInputFocused && state === "ready" && !isPttActive) {
          onBeginPtt();
        }
      }
    };

    const handleKeyUp = (evt: KeyboardEvent) => {
      if (evt.key === " ") {
        evt.preventDefault();
        if (isPttActive) {
          onEndPtt();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [state, isPttActive, onBeginPtt, onEndPtt]);

  const hasVisual = Boolean(activeVisual);

  return (
    <Box sx={{
      position: "relative",
      height: "100dvh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      bgcolor: "background.default",
    }}>
      {/* Mesh Gradient Background */}
      <Box className="mesh-gradient" sx={{ opacity: state === "ready" ? 0.6 : 0.3 }} />

      {/* Active Visuals — Bottom Sheet */}
      {hasVisual && (
        <Fade in timeout={300}>
          <Box sx={{
            position: "absolute",
            bottom: 180,
            left: 0,
            right: 0,
            zIndex: 5,
            px: 1,
            maxHeight: "45vh",
            overflowY: "auto",
            overflowX: "hidden",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}>
            <Box sx={{
              bgcolor: "rgba(13,13,15,0.92)",
              backdropFilter: "blur(24px)",
              borderRadius: 0,
              border: "1px solid rgba(255,255,255,0.06)",
              p: 2,
              boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
            }}>
              <ActiveVisualSlot activeVisual={activeVisual} />
            </Box>
          </Box>
        </Fade>
      )}

      {/* Center Orb */}
      <Box sx={{
        position: "relative",
        zIndex: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
      }}>
        {/* State Label */}
        <Typography sx={{
          fontSize: "0.75rem",
          fontWeight: 700,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: visualState === "speaking" ? "secondary.main" : visualState === "error" ? "error.main" : "primary.main",
          opacity: state === "idle" ? 0.4 : 0.9,
          transition: "all 0.3s ease",
        }}>
          {state === "idle" ? "Tap to Start" : visualState === "listening" ? "Listening" : visualState === "speaking" ? "Speaking" : visualState === "holding" ? "Hold to Talk" : visualState === "awaiting" ? "Processing" : visualState === "error" ? "Error" : "Ready"}
        </Typography>

        {/* Orb */}
        {state === "ready" ? (
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
              width: 120,
              height: 120,
              borderWidth: 3,
              background: "transparent",
            }}
          >
            <span className="orb-core" />
          </button>
        ) : (
          <Box sx={{
            width: 120,
            height: 120,
            borderRadius: 0,
            border: "3px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.5,
          }}>
            <MicIcon sx={{ fontSize: 40, color: "text.secondary", opacity: 0.5 }} />
          </Box>
        )}
      </Box>

      {/* Bottom Controls */}
      <Box sx={{
        position: "absolute",
        bottom: 90,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1.5,
        width: "100%",
        px: 2,
      }}>
        {/* Warning Capsule */}
        {warning && (
          <Fade in={!!warning}>
            <Box sx={{
              bgcolor: "rgba(255,159,67,0.12)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,159,67,0.25)",
              borderRadius: 0,
              px: 2,
              py: 0.75,
              display: "flex",
              alignItems: "center",
              gap: 1,
              maxWidth: "90%",
            }}>
              <InfoIcon sx={{ fontSize: 14, color: "secondary.main", flexShrink: 0 }} />
              <Typography sx={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "secondary.light",
                lineHeight: 1.3,
              }}>
                {warning}
              </Typography>
            </Box>
          </Fade>
        )}

        {/* Action Button */}
        {state !== "ready" && (
          <Button
            fullWidth
            variant="contained"
            color={state === "error" ? "error" : "primary"}
            onClick={state === "idle" || state === "error" ? onConnect : onDisconnect}
            disabled={state === "connecting"}
            sx={{
              maxWidth: 360,
              py: 1.5,
              fontSize: "0.95rem",
              fontWeight: 700,
              letterSpacing: "0.02em",
              borderRadius: 0,
              background: state === "connecting"
                ? "rgba(255,255,255,0.06)"
                : "linear-gradient(135deg, #00D4AA 0%, #00A885 100%)",
              boxShadow: "0 8px 24px rgba(0,212,170,0.25)",
              "&:hover": {
                boxShadow: "0 12px 32px rgba(0,212,170,0.35)",
              },
            }}
          >
            {state === "connecting" ? "Connecting..." : state === "error" ? "Retry Connection" : "Start Session"}
          </Button>
        )}

        {state === "ready" && (
          <Button
            variant="text"
            color="inherit"
            onClick={onDisconnect}
            sx={{
              fontWeight: 600,
              fontSize: "0.8rem",
              opacity: 0.4,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              "&:hover": { opacity: 0.7 },
            }}
          >
            End Session
          </Button>
        )}
      </Box>

      {/* Toast */}
      <Snackbar
        key={toast?.key}
        open={Boolean(toast)}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ top: "48px !important" }}
      >
        {toast ? (
          <Alert
            severity={toast.severity}
            variant="filled"
            onClose={() => setToast(null)}
            sx={{
              borderRadius: 0,
              fontSize: "0.8rem",
              fontWeight: 700,
              py: 0.5,
              px: 2,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              bgcolor: toast.severity === "success" ? "primary.dark" : "error.dark",
              color: toast.severity === "success" ? "#000" : "#fff",
              "& .MuiAlert-icon": { fontSize: 18 },
            }}
          >
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}

// Renders exactly one visual at a time, keyed by activeVisual.kind so that
// React fully unmounts the previous visual when the agent pivots to a new topic
// and mounts the next one with a fade-in transition.
function ActiveVisualSlot({ activeVisual }: { activeVisual: ActiveVisual }) {
  if (!activeVisual) return null;

  const renderContent = () => {
    switch (activeVisual.kind) {
      case "adherence": {
        const data = activeVisual.data;
        return (
          <Box>
            <Typography sx={{
              fontSize: "0.7rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "text.secondary",
              mb: 1.5,
            }}>
              Adherence
            </Typography>
            <AdherenceDoughnut
              adherence={data.overallAdherence}
              activityBreakdown={data.activityBreakdown as any}
              size={160}
            />
            {data.todayTotal > 0 && (
              <Typography
                sx={{
                  color: "text.secondary",
                  textAlign: "center",
                  mt: 1,
                  fontWeight: 600,
                  fontSize: "0.75rem",
                }}
              >
                {data.todayCompleted}/{data.todayTotal} today
              </Typography>
            )}
          </Box>
        );
      }
      case "physiotherapy": {
        const data = activeVisual.data;
        return (
          <Box>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, mb: 1 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: "success.main" }}>
                {data.latestScore !== null ? data.latestScore : "—"}
              </Typography>
              <Typography sx={{ color: "text.secondary", fontSize: "0.8rem", fontWeight: 600 }}>
                /100
              </Typography>
            </Box>
            <PhysiotherapyScoreChart physiotherapyHistory={data.history} height={100} />
          </Box>
        );
      }
      case "pain": {
        const data = activeVisual.data;
        return (
          <Box>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, mb: 1 }}>
              <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: "warning.main" }}>
                {data.latestValue !== null ? data.latestValue : "—"}
              </Typography>
              <Typography sx={{ color: "text.secondary", fontSize: "0.8rem", fontWeight: 600 }}>
                /10
              </Typography>
            </Box>
            <PainIndexChart painIndexHistory={data.history} height={100} />
          </Box>
        );
      }
      case "currentActivity": {
        const data = activeVisual.data;
        if (data.currentItem) {
          return (
            <ActivityCard
              item={data.currentItem}
              status="pending"
              isCurrent={data.inWindow}
              message={data.message}
            />
          );
        }
        if (data.upcomingItem) {
          return (
            <ActivityCard
              item={data.upcomingItem}
              status="pending"
              isUpcoming
              message={data.message}
            />
          );
        }
        return (
          <Typography sx={{ color: "text.secondary", fontSize: "0.8125rem", lineHeight: 1.4 }}>
            {data.message}
          </Typography>
        );
      }
      case "doctors":
        return (
          <DoctorRecommendations
            symptomsSummary={activeVisual.data.symptomsSummary}
            doctors={activeVisual.data.doctors}
          />
        );
      case "booking":
        return <BookingUpdates updates={[activeVisual.data]} />;
    }
  };

  return (
    <Fade in key={activeVisual.kind} timeout={250}>
      <Box>{renderContent()}</Box>
    </Fade>
  );
}
