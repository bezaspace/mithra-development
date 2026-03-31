import { useEffect, useMemo, useState } from "react";
import {
  Container,
  Box,
  Typography,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Stack,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  EventNote as EventIcon,
  Schedule as TimeIcon,
  CheckCircle as DoneIcon,
  PendingOutlined as PendingIcon,
  WarningAmber as WarningIcon,
  InfoOutlined as InfoIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";

import { getTodaySchedule } from "../lib/scheduleApi";
import type {
  AdherenceReportSavedEvent,
  AdherenceReportSavedSuccessEvent,
  ScheduleItemCard,
  ScheduleSnapshotPayload,
  ScheduleTimelineEntry,
  ServerEvent,
} from "../lib/liveSocket";

type AdherenceUpdateEvent = AdherenceReportSavedEvent;
type ScheduleSnapshotEvent = Extract<ServerEvent, { type: "schedule_snapshot" }>;

type Props = {
  backendHttpUrl: string;
  userId: string;
  liveSnapshot: ScheduleSnapshotEvent | null;
  liveReportUpdate: AdherenceUpdateEvent | null;
};

const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

const isGuestUser = (userId: string): boolean => {
  return userId.startsWith("guest-");
};

export function SchedulePage({ backendHttpUrl, userId, liveSnapshot, liveReportUpdate }: Props) {
  const [snapshot, setSnapshot] = useState<ScheduleSnapshotPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mismatchHint, setMismatchHint] = useState("");

  const selectedDate = useMemo(() => new Date().toLocaleDateString("en-CA"), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    void getTodaySchedule({
      baseUrl: backendHttpUrl,
      userId,
      timezone: browserTimezone,
      date: selectedDate,
    })
      .then((result) => {
        if (!cancelled) {
          setSnapshot(result);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load schedule.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [backendHttpUrl, userId, selectedDate]);

  useEffect(() => {
    if (!liveSnapshot) return;
    const { type: _type, ...rest } = liveSnapshot;
    setSnapshot(rest);
  }, [liveSnapshot]);

  useEffect(() => {
    if (!liveReportUpdate) return;
    if (!liveReportUpdate.saved) {
      return;
    }
    const viewingDate = snapshot?.date ?? selectedDate;
    if (liveReportUpdate.date !== viewingDate) {
      setMismatchHint(
        `A log was saved for ${liveReportUpdate.date}. You are currently viewing ${viewingDate}.`
      );
      return;
    }
    setMismatchHint("");
    setSnapshot((prev) => applyLiveReportUpdate(prev, liveReportUpdate));
  }, [liveReportUpdate, selectedDate, snapshot?.date]);

  const getStatusInfo = (status: string | undefined) => {
    const s = status || "pending";
    switch (s) {
      case "done":
        return { color: "success", icon: <DoneIcon fontSize="small" />, label: "Completed" };
      case "partial":
        return { color: "warning", icon: <InfoIcon fontSize="small" />, label: "Partial" };
      case "skipped":
        return { color: "error", icon: <WarningIcon fontSize="small" />, label: "Skipped" };
      case "delayed":
        return { color: "secondary", icon: <TimeIcon fontSize="small" />, label: "Delayed" };
      default:
        return { color: "default", icon: <PendingIcon fontSize="small" />, label: "Pending" };
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 0 }}>
      {/* Header Area */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Daily Schedule
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <EventIcon sx={{ color: "text.secondary", fontSize: 20 }} />
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {snapshot ? `${snapshot.date}` : `${selectedDate}`} • {browserTimezone}
          </Typography>
        </Stack>
      </Box>

      {loading ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <CircularProgress size={32} />
          <Typography sx={{ mt: 2, color: "text.secondary" }}>Synchronizing schedule...</Typography>
        </Box>
      ) : error ? (
        isGuestUser(userId) ? (
          <Paper sx={{ p: 4, textAlign: "center", bgcolor: "background.paper", borderRadius: 4 }}>
            <CalendarIcon sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
            <Typography variant="h6" sx={{ color: "text.primary", mb: 1 }}>
              No Schedule Yet
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Start a conversation with the AI assistant and it can help create your personalized health schedule.
            </Typography>
          </Paper>
        ) : (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        )
      ) : mismatchHint ? (
        <Alert severity="info" sx={{ mb: 3 }}>{mismatchHint}</Alert>
      ) : null}

      {!loading && snapshot && (
        <Box>
          {snapshot.items.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: "center", bgcolor: "background.paper", borderRadius: 4 }}>
              <CalendarIcon sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
              <Typography variant="h6" color="text.primary" sx={{ mb: 1 }}>
                No Activities Scheduled
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isGuestUser(userId) 
                  ? "Your personalized schedule will appear here after you create your health profile."
                  : "Your schedule will appear here once medical tasks are assigned."}
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {snapshot.items.map((item) => {
                const itemLogs = getLogsForItem(snapshot.timeline, item.scheduleItemId);
                const statusInfo = getStatusInfo(item.latestReport?.status);

                return (
                  <Accordion
                    key={item.scheduleItemId}
                    elevation={0}
                    sx={{
                      bgcolor: "background.paper",
                      border: "1px solid",
                      borderColor: "rgba(255, 255, 255, 0.05)",
                      borderRadius: "16px !important",
                      overflow: "hidden",
                      "&:before": { display: "none" },
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon sx={{ color: "text.secondary" }} />}
                      sx={{
                        px: 3,
                        py: 1,
                        "& .MuiAccordionSummary-content": {
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mr: 2,
                        },
                      }}
                    >
                      <Box>
                        <Typography variant="h6" sx={{ fontSize: "1rem", fontWeight: 700 }}>
                          {item.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.8rem", mt: 0.5 }}>
                          {item.activityType} • {item.windowStartLocal} - {item.windowEndLocal}
                        </Typography>
                      </Box>
                      <Chip
                        icon={statusInfo.icon}
                        label={statusInfo.label}
                        size="small"
                        color={statusInfo.color as any}
                        sx={{ fontWeight: 600, px: 0.5 }}
                      />
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                      <Divider sx={{ mb: 2, opacity: 0.1 }} />
                      
                      <Typography variant="subtitle2" sx={{ color: "primary.light", mb: 1, fontWeight: 700, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: 1 }}>
                        Plan Details
                      </Typography>
                      <List dense sx={{ mb: 3 }}>
                        {item.instructions.map((instruction, idx) => (
                          <ListItem key={`${item.scheduleItemId}-${idx}`} sx={{ px: 0, py: 0.5, alignItems: "flex-start" }}>
                            <Box sx={{ width: 6, height: 6, bgcolor: "primary.main", borderRadius: "50%", mt: 1, mr: 1.5, flexShrink: 0 }} />
                            <ListItemText 
                              primary={instruction} 
                              primaryTypographyProps={{ sx: { color: "text.primary", fontSize: "0.875rem" } }}
                            />
                          </ListItem>
                        ))}
                      </List>

                      <Typography variant="subtitle2" sx={{ color: "primary.light", mb: 2, fontWeight: 700, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: 1 }}>
                        Adherence Logs
                      </Typography>
                      
                      {itemLogs.length === 0 ? (
                        <Typography variant="body2" sx={{ color: "text.secondary", fontStyle: "italic" }}>
                          No activity logged yet.
                        </Typography>
                      ) : (
                        <Stack spacing={2}>
                          {itemLogs.map((entry) => (
                            <Paper
                              key={entry.reportId}
                              variant="outlined"
                              sx={{
                                p: 2,
                                bgcolor: "rgba(255, 255, 255, 0.02)",
                                borderRadius: 3,
                                borderColor: entry.alertLevel === "urgent" ? "error.main" : entry.alertLevel === "watch" ? "warning.main" : "rgba(255, 255, 255, 0.05)",
                                borderLeftWidth: 4,
                              }}
                            >
                              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.primary", textTransform: "capitalize" }}>
                                  {entry.status}
                                </Typography>
                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                  {formatReportedTime(entry.reportedAtIso)}
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ color: "text.primary", mb: 1 }}>
                                {entry.summary}
                              </Typography>
                              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                <Chip label={entry.followedPlan ? "Followed Plan" : "Deviated from Plan"} size="small" variant="outlined" sx={{ fontSize: "0.65rem", height: 20 }} />
                                {entry.feltAfter && <Chip label={`Felt: ${entry.feltAfter}`} size="small" variant="outlined" sx={{ fontSize: "0.65rem", height: 20 }} />}
                                {entry.symptoms && <Chip label={`Symptoms: ${entry.symptoms}`} size="small" variant="outlined" sx={{ fontSize: "0.65rem", height: 20, color: "warning.main", borderColor: "warning.main" }} />}
                              </Box>
                            </Paper>
                          ))}
                        </Stack>
                      )}
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>
          )}
        </Box>
      )}
    </Container>
  );
}

const applyLiveReportUpdate = (
  snapshot: ScheduleSnapshotPayload | null,
  event: AdherenceReportSavedSuccessEvent
): ScheduleSnapshotPayload | null => {
  if (!snapshot) return snapshot;
  if (snapshot.date !== event.date) return snapshot;

  const newTimelineEntry: ScheduleTimelineEntry = {
    reportId: event.reportId,
    scheduleItemId: event.scheduleItemId,
    activityType: event.activityType,
    status: event.status,
    followedPlan: event.followedPlan ?? false,
    changesMade: event.changesMade ?? null,
    feltAfter: event.feltAfter ?? null,
    symptoms: event.symptoms ?? null,
    notes: event.notes ?? null,
    alertLevel: event.alertLevel,
    summary: event.summary,
    reportedAtIso: event.reportedAtIso,
    createdAt: event.createdAt,
    conversationTurnId: event.conversationTurnId ?? null,
    sessionId: event.sessionId ?? null,
  };

  const timelineById = new Map<string, ScheduleTimelineEntry>();
  snapshot.timeline.forEach((item) => {
    timelineById.set(item.reportId, item);
  });
  timelineById.set(newTimelineEntry.reportId, newTimelineEntry);
  const updatedTimeline = Array.from(timelineById.values()).sort((a, b) => a.reportedAtIso.localeCompare(b.reportedAtIso));

  const updatedItems: ScheduleItemCard[] = snapshot.items.map((item) => {
    if (item.scheduleItemId !== event.scheduleItemId) return item;
    return {
      ...item,
      latestReport: {
        reportId: event.reportId,
        status: event.status,
        alertLevel: event.alertLevel,
        summary: event.summary,
        reportedAtIso: event.reportedAtIso,
      },
    };
  });

  return {
    ...snapshot,
    items: updatedItems,
    timeline: updatedTimeline,
  };
};

const getLogsForItem = (timeline: ScheduleTimelineEntry[], scheduleItemId: string): ScheduleTimelineEntry[] => {
  return timeline
    .filter((entry) => entry.scheduleItemId === scheduleItemId)
    .sort((a, b) => b.reportedAtIso.localeCompare(a.reportedAtIso));
};

const formatReportedTime = (reportedAtIso: string): string => {
  const date = new Date(reportedAtIso);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};
