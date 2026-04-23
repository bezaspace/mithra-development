import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Chip,
  Paper,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  CheckCircle as DoneIcon,
  PendingOutlined as PendingIcon,
  WarningAmber as WarningIcon,
  InfoOutlined as InfoIcon,
  AccessTime as TimeIcon,
  Add as AddIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import {
  LinearProgress,
  Button,
} from "@mui/material";

import { getTodaySchedule } from "../lib/scheduleApi";
import { submitAdherenceReport } from "../components/dashboard/dashboardApi";
import { ScheduleLogForm } from "../components/dashboard/ScheduleLogForm";
import type { ReportFormData, PatientDashboard } from "../components/dashboard/dashboardTypes";
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
  const [openFormId, setOpenFormId] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedDate = useMemo(() => new Date().toLocaleDateString("en-CA"), []);

  // Helper to map ScheduleItemCard to what ScheduleLogForm expects
  const mapCardToScheduleItem = (card: ScheduleItemCard): PatientDashboard["dailySchedule"][number] => {
    return {
      id: card.scheduleItemId,
      time: card.windowStartLocal,
      endTime: card.windowEndLocal,
      title: card.title,
      type: (card.activityType === "sleep" ? "rest" : card.activityType === "activity" ? "exercise" : card.activityType) as any,
      instructions: card.instructions,
      status: card.latestReport?.status === "done" ? "done" : card.latestReport ? "in-progress" : "pending",
      latestReport: card.latestReport ? {
        ...card.latestReport,
        followedPlan: true, // fallback
        changesMade: null,
        feltAfter: null,
        symptoms: null,
        notes: null,
      } : undefined,
    };
  };

  const handleSaveReport = async (item: ScheduleItemCard, formData: ReportFormData) => {
    setSubmittingId(item.scheduleItemId);
    setSubmitError(null);

    try {
      const savedReport = await submitAdherenceReport(item.scheduleItemId, {
        user_id: userId,
        timezone: browserTimezone,
        ...formData,
      });

      // Update local state with the newly saved report
      const successEvent: AdherenceReportSavedSuccessEvent = {
        type: "adherence_report_saved",
        saved: true,
        reportId: savedReport.reportId,
        scheduleItemId: item.scheduleItemId,
        date: snapshot?.date || selectedDate,
        activityType: item.activityType,
        status: savedReport.status,
        alertLevel: savedReport.alertLevel,
        summary: savedReport.summary,
        reportedAtIso: savedReport.reportedAtIso,
        createdAt: savedReport.reportedAtIso,
        followedPlan: savedReport.followedPlan,
        changesMade: savedReport.changesMade,
        feltAfter: savedReport.feltAfter,
        symptoms: savedReport.symptoms,
        notes: savedReport.notes,
        message: "Successfully saved log",
      };

      setSnapshot((prev) => applyLiveReportUpdate(prev, successEvent));
      setOpenFormId(null);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save log.");
    } finally {
      setSubmittingId(null);
    }
  };

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

  const completedCount = snapshot?.items.filter(item => item.latestReport?.status === 'done').length || 0;
  const totalCount = snapshot?.items.length || 0;
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const statusColorMap: Record<string, string> = {
    done: "#00D4AA",
    partial: "#FF9F43",
    skipped: "#FF5757",
    delayed: "#33A1FF",
    pending: "#8A8A8E",
  };

  return (
    <Box sx={{ pt: 2, pb: 2, px: { xs: 1.5, sm: 2 } }}>
      {/* Compact Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "1.15rem", color: "text.primary", letterSpacing: "-0.01em" }}>
          Schedule
        </Typography>
        <Chip
          label={snapshot ? snapshot.date : selectedDate}
          size="small"
          sx={{
            bgcolor: "rgba(255,255,255,0.04)", color: "text.secondary",
            fontSize: "0.65rem", fontWeight: 700, height: 24,
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        />
      </Box>

      {/* Progress Bar */}
      {!loading && snapshot && snapshot.items.length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.75 }}>
            <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {completedCount}/{totalCount} done
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: progressPercent >= 70 ? "success.main" : progressPercent >= 40 ? "primary.main" : "warning.main" }}>
              {progressPercent}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progressPercent}
            sx={{
              height: 5,
              borderRadius: 0,
              bgcolor: "rgba(255,255,255,0.04)",
              "& .MuiLinearProgress-bar": {
                bgcolor: progressPercent >= 70 ? "success.main" : progressPercent >= 40 ? "primary.main" : "warning.main",
                borderRadius: 0,
              },
            }}
          />
        </Box>
      )}

      {/* States */}
      {loading ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <CircularProgress size={28} sx={{ color: "primary.main" }} />
          <Typography sx={{ mt: 1.5, color: "text.secondary", fontSize: "0.8rem", fontWeight: 600 }}>Syncing...</Typography>
        </Box>
      ) : error ? (
        isGuestUser(userId) ? (
          <Paper sx={{ p: 3, textAlign: "center", bgcolor: "background.paper", borderRadius: 0, border: "1px solid rgba(255,255,255,0.06)" }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: "text.primary", mb: 0.5 }}>No Schedule Yet</Typography>
            <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>Start a conversation to create your schedule.</Typography>
          </Paper>
        ) : (
          <Alert severity="error" sx={{ borderRadius: 0, fontSize: "0.8125rem" }}>{error}</Alert>
        )
      ) : mismatchHint ? (
        <Alert severity="info" sx={{ borderRadius: 0, fontSize: "0.8125rem", mb: 2 }}>{mismatchHint}</Alert>
      ) : null}

      {/* Timeline */}
      {!loading && snapshot && (
        <Box>
          {snapshot.items.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: "center", bgcolor: "background.paper", borderRadius: 0, border: "1px solid rgba(255,255,255,0.06)" }}>
              <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: "text.primary", mb: 0.5 }}>No Activities</Typography>
              <Typography sx={{ fontSize: "0.75rem", color: "text.secondary" }}>
                {isGuestUser(userId)
                  ? "Create your profile to get a personalized schedule."
                  : "Tasks will appear once assigned."}
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", position: "relative" }}>
              {/* Vertical connecting line */}
              <Box sx={{
                position: "absolute", left: 18, top: 12, bottom: 12,
                width: 2, bgcolor: "rgba(255,255,255,0.04)", borderRadius: 0,
              }} />

              {snapshot.items.map((item, idx) => {
                const itemLogs = getLogsForItem(snapshot.timeline, item.scheduleItemId);
                const statusInfo = getStatusInfo(item.latestReport?.status);
                const isOpen = openFormId === item.scheduleItemId;
                const dotColor = statusColorMap[item.latestReport?.status || "pending"] || "#8A8A8E";

                return (
                  <Box key={item.scheduleItemId} sx={{ position: "relative", pl: 5, pb: 2 }}>
                    {/* Timeline dot */}
                    <Box sx={{
                      position: "absolute", left: 10, top: 10,
                      width: 18, height: 18, borderRadius: 0,
                      bgcolor: "background.default",
                      border: `3px solid ${dotColor}`,
                      zIndex: 1,
                    }} />

                    {/* Card */}
                    <Box sx={{
                      bgcolor: "background.paper",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 0,
                      overflow: "hidden",
                      borderLeft: `3px solid ${dotColor}`,
                    }}>
                      {/* Header row — always visible */}
                      <Box
                        onClick={() => {
                          if (!isOpen) {
                            setSubmitError(null);
                            setOpenFormId(isOpen ? null : item.scheduleItemId);
                          }
                        }}
                        sx={{
                          p: 1.5,
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          cursor: "pointer",
                          "&:active": { bgcolor: "rgba(255,255,255,0.02)" },
                        }}
                      >
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: "text.primary", lineHeight: 1.3 }}>
                            {item.title}
                          </Typography>
                          <Typography sx={{ fontSize: "0.65rem", color: "text.secondary", fontWeight: 600, mt: 0.25 }}>
                            {item.windowStartLocal} — {item.windowEndLocal} • {item.activityType}
                          </Typography>
                        </Box>
                        <Chip
                          icon={statusInfo.icon}
                          label={statusInfo.label}
                          size="small"
                          sx={{
                            height: 22, fontSize: "0.6rem", fontWeight: 800,
                            bgcolor: `${dotColor}15`, color: dotColor,
                            border: `1px solid ${dotColor}30`,
                            ml: 1, flexShrink: 0,
                            "& .MuiChip-icon": { color: dotColor, fontSize: 12 },
                          }}
                        />
                      </Box>

                      {/* Expanded content */}
                      {isOpen && (
                        <Box sx={{ px: 1.5, pb: 1.5, pt: 0 }}>
                          {/* Instructions */}
                          {item.instructions.length > 0 && (
                            <Box sx={{ mb: 1.5 }}>
                              <Typography sx={{
                                fontSize: "0.6rem", fontWeight: 700, color: "text.secondary",
                                textTransform: "uppercase", letterSpacing: "0.08em", mb: 0.75,
                              }}>
                                Instructions
                              </Typography>
                              {item.instructions.map((instruction, i) => (
                                <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 0.5 }}>
                                  <Box sx={{ width: 5, height: 5, borderRadius: 0, bgcolor: "primary.main", mt: 0.75, flexShrink: 0 }} />
                                  <Typography sx={{ fontSize: "0.75rem", color: "text.primary", fontWeight: 500, lineHeight: 1.4 }}>
                                    {instruction}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          )}

                          {/* Logs */}
                          {itemLogs.length > 0 && (
                            <Box sx={{ mb: 1.5 }}>
                              <Typography sx={{
                                fontSize: "0.6rem", fontWeight: 700, color: "text.secondary",
                                textTransform: "uppercase", letterSpacing: "0.08em", mb: 0.75,
                              }}>
                                Logs
                              </Typography>
                              {itemLogs.map((entry) => (
                                <Box key={entry.reportId} sx={{
                                  bgcolor: "rgba(255,255,255,0.02)", borderRadius: 0,
                                  border: `1px solid ${entry.alertLevel === "urgent" ? "rgba(255,87,87,0.2)" : entry.alertLevel === "watch" ? "rgba(255,159,67,0.2)" : "rgba(255,255,255,0.05)"}`,
                                  p: 1, mb: 0.75,
                                  borderLeft: `3px solid ${entry.alertLevel === "urgent" ? "#FF5757" : entry.alertLevel === "watch" ? "#FF9F43" : "transparent"}`,
                                }}>
                                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                                    <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "text.primary", textTransform: "capitalize" }}>
                                      {entry.status}
                                    </Typography>
                                    <Typography sx={{ fontSize: "0.6rem", color: "text.secondary", fontWeight: 600 }}>
                                      {formatReportedTime(entry.reportedAtIso)}
                                    </Typography>
                                  </Box>
                                  <Typography sx={{ fontSize: "0.7rem", color: "text.primary", mb: 0.5 }}>{entry.summary}</Typography>
                                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                    <Chip label={entry.followedPlan ? "Followed" : "Deviated"} size="small" sx={{ height: 16, fontSize: "0.55rem", fontWeight: 700, bgcolor: "rgba(255,255,255,0.04)", color: "text.secondary" }} />
                                    {entry.feltAfter && <Chip label={entry.feltAfter} size="small" sx={{ height: 16, fontSize: "0.55rem", fontWeight: 700, bgcolor: "rgba(255,255,255,0.04)", color: "text.secondary" }} />}
                                    {entry.symptoms && <Chip label={entry.symptoms} size="small" sx={{ height: 16, fontSize: "0.55rem", fontWeight: 700, bgcolor: "rgba(255,159,67,0.08)", color: "secondary.main" }} />}
                                  </Box>
                                </Box>
                              ))}
                            </Box>
                          )}

                          {/* Log button */}
                          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                            <Button
                              size="small"
                              variant={item.latestReport ? "text" : "contained"}
                              onClick={() => {
                                setSubmitError(null);
                                setOpenFormId(isOpen ? null : item.scheduleItemId);
                              }}
                              startIcon={item.latestReport ? <EditIcon sx={{ fontSize: 14 }} /> : <AddIcon sx={{ fontSize: 14 }} />}
                              sx={{
                                textTransform: "none",
                                fontWeight: 700,
                                fontSize: "0.8rem",
                                borderRadius: 0,
                                px: 2,
                                py: 0.5,
                                color: item.latestReport ? "text.secondary" : "#000",
                                bgcolor: item.latestReport ? "transparent" : "primary.main",
                                "&:hover": {
                                  bgcolor: item.latestReport ? "rgba(255,255,255,0.04)" : "primary.light",
                                },
                              }}
                            >
                              {item.latestReport ? "Edit" : "Log Task"}
                            </Button>
                          </Box>

                          {/* Form */}
                          <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                            <ScheduleLogForm
                              item={mapCardToScheduleItem(item)}
                              submitting={submittingId === item.scheduleItemId}
                              error={submitError}
                              onCancel={() => {
                                setOpenFormId(null);
                                setSubmitError(null);
                              }}
                              onSave={(formData) => handleSaveReport(item, formData)}
                            />
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      )}
    </Box>
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
