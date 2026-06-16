import { useState, useEffect } from "react";

// ─── DATA ────────────────────────────────────────────────────────────────────

const PHASES = [
  { id: 0, name: "Endurance", weeks: 3, pct: 0.60, color: "#4ECDC4", emoji: "🔵" },
  { id: 1, name: "Hypertrophie", weeks: 3, pct: 0.70, color: "#FFE66D", emoji: "🟡" },
  { id: 2, name: "Force", weeks: 3, pct: 0.80, color: "#FF6B6B", emoji: "🔴" },
  { id: 3, name: "Force Max", weeks: 3, pct: 0.90, color: "#C77DFF", emoji: "🟣" },
];

// type: "compound" | "isolation"
// baseReps: reps at 80% (your current 3x8 reference)
// basePoids: total weight in kg at your 3x8
// machineWeight: fixed machine weight to add (not adjustable)
const DAYS = [
  {
    id: 0, name: "Push 1", muscles: "Poitrine · Épaules · Triceps",
    exercises: [
      { id: "d1e1", name: "Dév. couché haltères", type: "compound", basePoids: 32.5, unit: "kg/haltère", baseReps: 8 },
      { id: "d1e2", name: "Vertical Bench Press", type: "compound", basePoids: 27.5, machineWeight: 6.8, unit: "kg/côté", baseReps: 8, note: "+6.8 kg/côté machine" },
      { id: "d1e3", name: "Dév. militaire haltères", type: "compound", basePoids: 22.5, unit: "kg/haltère", baseReps: 8 },
      { id: "d1e4", name: "Dips lestés", type: "compound", basePoids: 12.5, unit: "kg lest", baseReps: 8 },
      { id: "d1e5", name: "Extensions triceps poulie", type: "isolation", basePoids: 18, unit: "kg (+2.3)", baseReps: 12 },
    ]
  },
  {
    id: 1, name: "Pull 1", muscles: "Dos · Biceps · Arrière épaule",
    exercises: [
      { id: "d2e1", name: "Tractions pronation", type: "compound", basePoids: 12.5, unit: "kg lest", baseReps: 8 },
      { id: "d2e2", name: "Rowing barre courte", type: "compound", basePoids: 67.5, unit: "kg", baseReps: 8 },
      { id: "d2e3", name: "Reverse Butterfly", type: "isolation", basePoids: 52, unit: "kg", baseReps: 12 },
      { id: "d2e4", name: "Curl biceps poulie", type: "isolation", basePoids: 41, unit: "kg (+2.3)", baseReps: 12 },
      { id: "d2e5", name: "Curl incliné haltères", type: "isolation", basePoids: 12.5, unit: "kg/haltère", baseReps: 10 },
    ]
  },
  {
    id: 2, name: "Legs", muscles: "Jambes · Fessiers · Mollets",
    exercises: [
      { id: "d3e1", name: "Hack Squat", type: "compound", basePoids: 37.5, machineWeight: 47.6, unit: "kg/côté", baseReps: 8, note: "+47.6 kg machine" },
      { id: "d3e2", name: "SDL jambes tendues", type: "compound", basePoids: 40, unit: "kg/côté + barre", baseReps: 10 },
      { id: "d3e3", name: "Fentes marchées", type: "isolation", basePoids: 20, unit: "kg", baseReps: 24 },
      { id: "d3e4", name: "Leg curl (ischios)", type: "isolation", basePoids: 50, unit: "kg", baseReps: 12 },
      { id: "d3e5", name: "Mollets assis machine", type: "isolation", basePoids: 86, unit: "kg", baseReps: 15 },
    ]
  },
  {
    id: 3, name: "Push 2", muscles: "Épaules · Poitrine · Triceps",
    exercises: [
      { id: "d4e1", name: "Dév. militaire haltères", type: "compound", basePoids: 27.5, unit: "kg/haltère", baseReps: 8 },
      { id: "d4e2", name: "Élévations latérales", type: "isolation", basePoids: 12.5, unit: "kg", baseReps: 12 },
      { id: "d4e3", name: "Vertical Bench Press", type: "compound", basePoids: 27.5, machineWeight: 6.8, unit: "kg/côté", baseReps: 8, note: "+6.8 kg/côté machine" },
      { id: "d4e4", name: "Dips lestés", type: "compound", basePoids: 12.5, unit: "kg lest", baseReps: 8 },
      { id: "d4e5", name: "Extensions triceps poulie", type: "isolation", basePoids: 18, unit: "kg (+2.3)", baseReps: 12 },
    ]
  },
  {
    id: 4, name: "Pull 2", muscles: "Dos · Biceps · Arrière épaule",
    exercises: [
      { id: "d5e1", name: "Tractions pronation", type: "compound", basePoids: 12.5, unit: "kg lest", baseReps: 8 },
      { id: "d5e2", name: "Tirage horizontal poulie", type: "compound", basePoids: 45, unit: "kg (+2.3)", baseReps: 10 },
      { id: "d5e3", name: "Reverse Butterfly", type: "isolation", basePoids: 52, unit: "kg", baseReps: 12 },
      { id: "d5e4", name: "Curl biceps poulie", type: "isolation", basePoids: 41, unit: "kg (+2.3)", baseReps: 12 },
      { id: "d5e5", name: "Curl incliné haltères", type: "isolation", basePoids: 12.5, unit: "kg/haltère", baseReps: 12 },
    ]
  },
];

// Reps per phase, scaled proportionally from each exercise's OWN base reps
// (baseReps is assumed to be at Force phase = index 2, the user's current 3x8-equivalent)
// Multipliers relative to the Force baseline:
const REP_MULTIPLIERS = [1.7, 1.3, 1.0, 0.65]; // Endurance, Hypertrophie, Force, Force Max

function getReps(phase, type, baseReps) {
  const raw = baseReps * REP_MULTIPLIERS[phase];
  // Round to nearest sensible rep count (nearest 1 for low reps, nearest 2 for higher reps)
  if (raw >= 16) return Math.round(raw / 2) * 2;
  return Math.round(raw);
}

function calcWeight(basePoids, phaseIdx) {
  // basePoids is at 80% (phase 2 = Force)
  const base1RM = basePoids / 0.80;
  return Math.round((base1RM * PHASES[phaseIdx].pct) * 4) / 4; // round to 0.25
}

// ─── STORAGE HELPERS ─────────────────────────────────────────────────────────

const STORAGE_KEY = "fitness_app_state_v2";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

// Build initial weights from DAYS
function buildInitialWeights() {
  const w = {};
  DAYS.forEach(day => {
    day.exercises.forEach(ex => {
      w[ex.id] = ex.basePoids;
    });
  });
  return w;
}

function buildInitialStart() {
  return new Date().toISOString();
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function FitnessApp() {
  const [activeTab, setActiveTab] = useState("today"); // today | program | settings
  const getDefaultDay = () => {
    const dow = new Date().getDay(); // 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu
    const map = { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4 };
    return map[dow] ?? 0;
  };
  const [selectedDay, setSelectedDay] = useState(getDefaultDay());
  const [weights, setWeights] = useState({});
  const [cycleStart, setCycleStart] = useState(null);
  const [pausedWeeks, setPausedWeeks] = useState(0);
  const [pauseActive, setPauseActive] = useState(false);
  const [pauseStartDate, setPauseStartDate] = useState(null);
  const [editingEx, setEditingEx] = useState(null); // { id, value }
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseWeeksInput, setPauseWeeksInput] = useState(1);
  const [initialized, setInitialized] = useState(false);
  const [sessionLog, setSessionLog] = useState({}); // { "2026-06-16": dayId }

  // Load from storage on mount
  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setWeights(saved.weights || buildInitialWeights());
      setCycleStart(saved.cycleStart || buildInitialStart());
      setPausedWeeks(saved.pausedWeeks || 0);
      setPauseActive(saved.pauseActive || false);
      setPauseStartDate(saved.pauseStartDate || null);
      setSessionLog(saved.sessionLog || {});
    } else {
      setWeights(buildInitialWeights());
      setCycleStart(buildInitialStart());
    }
    setInitialized(true);
  }, []);

  // Save on change
  useEffect(() => {
    if (!initialized) return;
    saveState({ weights, cycleStart, pausedWeeks, pauseActive, pauseStartDate, sessionLog });
  }, [weights, cycleStart, pausedWeeks, pauseActive, pauseStartDate, sessionLog, initialized]);

  // Compute current phase
  function getCurrentPhase() {
    if (!cycleStart) return 0;
    const start = new Date(cycleStart);
    const now = new Date();
    const diffMs = now - start;
    const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    const effectiveDays = diffDays - pausedWeeks * 7;
    const totalCycleDays = 12 * 7;
    const dayInCycle = effectiveDays % totalCycleDays;
    const weekInCycle = Math.floor(dayInCycle / 7);
    return Math.min(3, Math.floor(weekInCycle / 3));
  }

  function getWeekInPhase() {
    if (!cycleStart) return 1;
    const start = new Date(cycleStart);
    const now = new Date();
    const diffDays = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
    const effectiveDays = diffDays - pausedWeeks * 7;
    const totalCycleDays = 12 * 7;
    const dayInCycle = effectiveDays % totalCycleDays;
    const weekInCycle = Math.floor(dayInCycle / 7);
    return (weekInCycle % 3) + 1;
  }

  function getNextPhaseDate() {
    if (!cycleStart) return null;
    const start = new Date(cycleStart);
    const now = new Date();
    const diffDays = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
    const effectiveDays = diffDays - pausedWeeks * 7;
    const totalCycleDays = 12 * 7;
    const dayInCycle = effectiveDays % totalCycleDays;
    const weekInCycle = Math.floor(dayInCycle / 7);
    const nextPhaseWeek = (Math.floor(weekInCycle / 3) + 1) * 3;
    const daysUntil = (nextPhaseWeek * 7) - dayInCycle + pausedWeeks * 7;
    const next = new Date(start);
    next.setDate(next.getDate() + daysUntil);
    return next;
  }

  const phaseIdx = getCurrentPhase();
  const phase = PHASES[phaseIdx];
  const weekInPhase = getWeekInPhase();
  const nextDate = getNextPhaseDate();

  function daysUntilNext() {
    if (!nextDate) return 0;
    const diff = Math.ceil((nextDate - new Date()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }

  function formatDate(d) {
    if (!d) return "";
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  }

  // ─── WEEK TRACKER (Sun-Thu training days, Fri/Sat rest) ──────────────────
  function dateKey(d) {
    return d.toISOString().split("T")[0];
  }

  function getCurrentWeekDates() {
    const today = new Date();
    const dow = today.getDay(); // 0=Sun
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - dow);
    const week = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      week.push(d);
    }
    return week;
  }

  const WEEKDAY_TO_DAYIDX = { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4 }; // Sun-Thu map to DAYS[0..4]
  const WEEKDAY_LABELS = ["D", "L", "M", "M", "J", "V", "S"];

  function toggleSession(d) {
    const key = dateKey(d);
    setSessionLog(prev => {
      const next = { ...prev };
      if (next[key] !== undefined) {
        delete next[key];
      } else {
        const dow = d.getDay();
        next[key] = WEEKDAY_TO_DAYIDX[dow] ?? null;
      }
      return next;
    });
  }

  // Calendar event URL
  function getCalendarUrl() {
    if (!nextDate) return "#";
    const start = nextDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const end = new Date(nextDate.getTime() + 60 * 60 * 1000).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const nextPhase = PHASES[(phaseIdx + 1) % 4];
    const title = encodeURIComponent(`💪 Changement phase fitness → ${nextPhase.name}`);
    const details = encodeURIComponent(`Passe en phase ${nextPhase.name} (${Math.round(nextPhase.pct * 100)}% du max). Ouvre ton app fitness pour les nouveaux poids.`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`;
  }

  // Weight edit
  function startEdit(exId, current) {
    setEditingEx({ id: exId, value: String(current) });
  }

  function commitEdit() {
    if (!editingEx) return;
    const val = parseFloat(editingEx.value);
    if (!isNaN(val) && val > 0) {
      setWeights(prev => ({ ...prev, [editingEx.id]: val }));
    }
    setEditingEx(null);
  }

  // Pause
  function activatePause(weeks) {
    setPauseActive(true);
    setPauseStartDate(new Date().toISOString());
    setPauseWeeksInput(1);
    setShowPauseModal(false);
    // We'll add the weeks when resuming
    alert(`Pause de ${weeks} semaine(s) activée. Bon repos ! 🏖️`);
    setPauseWeeksInput(weeks);
    // Store intended pause weeks to add when resuming
    setPauseActive({ weeks });
  }

  function resumeTraining() {
    const weeks = typeof pauseActive === "object" ? pauseActive.weeks : 1;
    setPausedWeeks(prev => prev + weeks);
    setPauseActive(false);
    setPauseStartDate(null);
  }

  function resetCycle() {
    if (window.confirm("Recommencer un nouveau cycle de 12 semaines ?")) {
      setCycleStart(new Date().toISOString());
      setPausedWeeks(0);
      setPauseActive(false);
      setPauseStartDate(null);
    }
  }

  // ─── RENDER ────────────────────────────────────────────────────────────────

  const styles = {
    app: {
      minHeight: "100vh",
      background: "#0F0F13",
      color: "#F0EEF6",
      fontFamily: "'Inter', -apple-system, sans-serif",
      maxWidth: 480,
      margin: "0 auto",
      paddingBottom: 80,
    },
    header: {
      padding: "20px 20px 0",
    },
    phaseBar: {
      background: `linear-gradient(135deg, ${phase.color}22, ${phase.color}11)`,
      border: `1px solid ${phase.color}44`,
      borderRadius: 16,
      padding: "16px 20px",
      margin: "16px 20px 0",
    },
    phaseName: {
      fontSize: 22,
      fontWeight: 800,
      color: phase.color,
      letterSpacing: -0.5,
    },
    phaseInfo: {
      fontSize: 13,
      color: "#9997A8",
      marginTop: 4,
    },
    progressRow: {
      display: "flex",
      gap: 6,
      marginTop: 12,
    },
    progressDot: (filled, col) => ({
      flex: 1,
      height: 5,
      borderRadius: 3,
      background: filled ? col : "#2A2A35",
      transition: "background 0.3s",
    }),
    nextAlert: {
      background: "#1A1A25",
      border: "1px solid #2A2A35",
      borderRadius: 12,
      padding: "12px 16px",
      margin: "12px 20px 0",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    calBtn: {
      background: phase.color,
      color: "#0F0F13",
      border: "none",
      borderRadius: 8,
      padding: "6px 12px",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
      whiteSpace: "nowrap",
      textDecoration: "none",
    },
    pauseBanner: {
      background: "#2A1A00",
      border: "1px solid #FF944422",
      borderRadius: 12,
      padding: "12px 16px",
      margin: "12px 20px 0",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    resumeBtn: {
      background: "#FF9444",
      color: "#0F0F13",
      border: "none",
      borderRadius: 8,
      padding: "6px 14px",
      fontWeight: 700,
      cursor: "pointer",
      fontSize: 13,
    },
    dayTabs: {
      display: "flex",
      gap: 8,
      padding: "16px 20px 0",
      overflowX: "auto",
      scrollbarWidth: "none",
    },
    dayTab: (active) => ({
      background: active ? phase.color : "#1A1A25",
      color: active ? "#0F0F13" : "#9997A8",
      border: "none",
      borderRadius: 10,
      padding: "8px 14px",
      fontWeight: active ? 700 : 500,
      fontSize: 13,
      cursor: "pointer",
      whiteSpace: "nowrap",
      transition: "all 0.2s",
    }),
    dayCard: {
      margin: "16px 20px 0",
    },
    dayTitle: {
      fontSize: 18,
      fontWeight: 800,
      marginBottom: 2,
    },
    dayMuscles: {
      fontSize: 12,
      color: "#9997A8",
      marginBottom: 14,
    },
    exCard: {
      background: "#1A1A25",
      borderRadius: 12,
      padding: "14px 16px",
      marginBottom: 10,
      border: "1px solid #2A2A35",
    },
    exHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 8,
    },
    exName: {
      fontSize: 14,
      fontWeight: 700,
      color: "#F0EEF6",
      flex: 1,
    },
    exType: (type) => ({
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: 0.5,
      color: type === "compound" ? "#FF6B6B" : "#4ECDC4",
      background: type === "compound" ? "#FF6B6B18" : "#4ECDC418",
      borderRadius: 6,
      padding: "3px 7px",
      marginLeft: 8,
    }),
    exRow: {
      display: "flex",
      gap: 10,
      alignItems: "center",
    },
    exPill: (col) => ({
      background: col + "22",
      border: `1px solid ${col}44`,
      borderRadius: 8,
      padding: "6px 12px",
      fontSize: 13,
      fontWeight: 700,
      color: col,
    }),
    exUnit: {
      fontSize: 11,
      color: "#9997A8",
      marginTop: 2,
    },
    editRow: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      marginTop: 10,
      paddingTop: 10,
      borderTop: "1px solid #2A2A35",
    },
    editLabel: {
      fontSize: 12,
      color: "#9997A8",
      flex: 1,
    },
    editInput: {
      background: "#0F0F13",
      border: `1px solid ${phase.color}`,
      borderRadius: 8,
      color: "#F0EEF6",
      fontSize: 14,
      fontWeight: 700,
      padding: "5px 10px",
      width: 80,
      textAlign: "right",
    },
    editBtn: (primary) => ({
      background: primary ? phase.color : "#2A2A35",
      color: primary ? "#0F0F13" : "#F0EEF6",
      border: "none",
      borderRadius: 8,
      padding: "6px 12px",
      fontWeight: 700,
      cursor: "pointer",
      fontSize: 13,
    }),
    updateBtn: {
      background: "none",
      border: `1px solid #2A2A35`,
      borderRadius: 8,
      color: "#9997A8",
      fontSize: 11,
      padding: "4px 10px",
      cursor: "pointer",
      marginTop: 8,
    },
    phaseGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10,
      margin: "16px 20px 0",
    },
    phaseCard: (p, active) => ({
      background: active ? p.color + "22" : "#1A1A25",
      border: `1px solid ${active ? p.color + "66" : "#2A2A35"}`,
      borderRadius: 12,
      padding: "14px",
      opacity: 1,
    }),
    phaseCardName: (col, active) => ({
      fontSize: 15,
      fontWeight: 800,
      color: active ? col : "#F0EEF6",
      marginBottom: 4,
    }),
    phaseCardDetail: {
      fontSize: 12,
      color: "#9997A8",
    },
    settingsSection: {
      margin: "16px 20px 0",
    },
    settingsTitle: {
      fontSize: 13,
      fontWeight: 700,
      color: "#9997A8",
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: 12,
    },
    settingsCard: {
      background: "#1A1A25",
      border: "1px solid #2A2A35",
      borderRadius: 12,
      padding: "14px 16px",
      marginBottom: 10,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    dangerBtn: {
      background: "#FF6B6B18",
      border: "1px solid #FF6B6B44",
      borderRadius: 8,
      color: "#FF6B6B",
      padding: "6px 14px",
      fontWeight: 700,
      cursor: "pointer",
      fontSize: 13,
    },
    pauseBtn: {
      background: "#FF944418",
      border: "1px solid #FF944444",
      borderRadius: 8,
      color: "#FF9444",
      padding: "6px 14px",
      fontWeight: 700,
      cursor: "pointer",
      fontSize: 13,
    },
    modal: {
      position: "fixed",
      inset: 0,
      background: "#0F0F13CC",
      display: "flex",
      alignItems: "flex-end",
      zIndex: 100,
    },
    modalContent: {
      background: "#1A1A25",
      border: "1px solid #2A2A35",
      borderRadius: "20px 20px 0 0",
      padding: "24px 20px 40px",
      width: "100%",
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 800,
      marginBottom: 16,
    },
    select: {
      background: "#0F0F13",
      border: "1px solid #2A2A35",
      borderRadius: 10,
      color: "#F0EEF6",
      fontSize: 15,
      padding: "10px 14px",
      width: "100%",
      marginBottom: 16,
    },
    bottomNav: {
      position: "fixed",
      bottom: 0,
      left: "50%",
      transform: "translateX(-50%)",
      width: "100%",
      maxWidth: 480,
      background: "#1A1A25",
      borderTop: "1px solid #2A2A35",
      display: "flex",
      padding: "10px 0 20px",
    },
    navBtn: (active) => ({
      flex: 1,
      background: "none",
      border: "none",
      color: active ? phase.color : "#9997A8",
      fontSize: 11,
      fontWeight: active ? 700 : 500,
      cursor: "pointer",
      padding: "6px 0",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 3,
    }),
    navIcon: {
      fontSize: 20,
    },
    weekTracker: {
      background: "#1A1A25",
      border: "1px solid #2A2A35",
      borderRadius: 14,
      padding: "14px 16px",
      margin: "12px 20px 0",
    },
    weekTitle: {
      fontSize: 12,
      color: "#9997A8",
      fontWeight: 700,
      letterSpacing: 0.5,
      marginBottom: 10,
      textTransform: "uppercase",
    },
    weekRow: {
      display: "flex",
      justifyContent: "space-between",
      gap: 6,
    },
    weekDayCol: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 6,
      flex: 1,
    },
    weekDayLabel: (isToday) => ({
      fontSize: 11,
      color: isToday ? phase.color : "#9997A8",
      fontWeight: isToday ? 800 : 500,
    }),
    weekDayCircle: (state, isRest) => {
      // state: "done" | "missed-past" | "future" | "today-pending"
      let bg = "#2A2A35";
      let border = "1px solid #2A2A35";
      let content = "";
      if (isRest) {
        bg = "transparent";
        border = "1px solid #2A2A3580";
      }
      if (state === "done") {
        bg = phase.color;
        border = `1px solid ${phase.color}`;
      }
      return {
        width: 34,
        height: 34,
        borderRadius: "50%",
        background: bg,
        border,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: isRest ? "default" : "pointer",
        fontSize: 15,
        transition: "all 0.15s",
      };
    },
  };

  const day = DAYS[selectedDay];

  function renderExercise(ex) {
    const userWeight = weights[ex.id] ?? ex.basePoids;
    const phaseWeight = calcWeight(userWeight, phaseIdx);
    const reps = getReps(phaseIdx, ex.type, ex.baseReps);
    const isEditing = editingEx?.id === ex.id;
    const machineW = ex.machineWeight || 0;
    const totalDisplay = ex.machineWeight
      ? `${phaseWeight} + ${machineW}${ex.id === "d1e2" || ex.id === "d4e3" ? " kg/côté" : " kg"} machine`
      : null;

    return (
      <div key={ex.id} style={styles.exCard}>
        <div style={styles.exHeader}>
          <span style={styles.exName}>{ex.name}</span>
          <span style={styles.exType(ex.type)}>
            {ex.type === "compound" ? "POLY" : "ISO"}
          </span>
        </div>
        <div style={styles.exRow}>
          <div style={styles.exPill(phase.color)}>
            3 × {reps}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#F0EEF6" }}>
              {phaseWeight} kg
            </div>
            <div style={styles.exUnit}>
              {ex.unit}{ex.note ? ` · ${ex.note}` : ""}
            </div>
            {totalDisplay && (
              <div style={{ fontSize: 11, color: phase.color, marginTop: 2 }}>
                Total: {totalDisplay}
              </div>
            )}
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#9997A8" }}>Votre base</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{userWeight} kg</div>
          </div>
        </div>

        {isEditing ? (
          <div style={styles.editRow}>
            <span style={styles.editLabel}>Nouveau poids (3×8) :</span>
            <input
              style={styles.editInput}
              type="number"
              step="0.5"
              value={editingEx.value}
              onChange={e => setEditingEx(prev => ({ ...prev, value: e.target.value }))}
              autoFocus
            />
            <button style={styles.editBtn(true)} onClick={commitEdit}>✓</button>
            <button style={styles.editBtn(false)} onClick={() => setEditingEx(null)}>✕</button>
          </div>
        ) : (
          <button style={styles.updateBtn} onClick={() => startEdit(ex.id, userWeight)}>
            ✏️ Mettre à jour mon poids
          </button>
        )}
      </div>
    );
  }

  function renderToday() {
    return (
      <div>
        <div style={styles.dayTabs}>
          {DAYS.map((d, i) => (
            <button key={d.id} style={styles.dayTab(selectedDay === i)} onClick={() => setSelectedDay(i)}>
              {d.name}
            </button>
          ))}
        </div>
        <div style={styles.dayCard}>
          <div style={styles.dayTitle}>{day.name}</div>
          <div style={styles.dayMuscles}>{day.muscles}</div>
          {day.exercises.map(renderExercise)}
        </div>
      </div>
    );
  }

  function renderProgram() {
    return (
      <div>
        <div style={{ padding: "20px 20px 0", fontSize: 20, fontWeight: 800 }}>
          Cycle 12 semaines
        </div>
        <div style={{ padding: "6px 20px 0", fontSize: 13, color: "#9997A8" }}>
          Débute le {formatDate(new Date(cycleStart))}
        </div>
        <div style={styles.phaseGrid}>
          {PHASES.map((p, i) => {
            const active = i === phaseIdx;
            const compound = [15, 12, 8, 5];
            const isolation = [20, 15, 12, 10];
            return (
              <div key={p.id} style={styles.phaseCard(p, active)}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{p.emoji}</div>
                <div style={styles.phaseCardName(p.color, active)}>{p.name}</div>
                <div style={styles.phaseCardDetail}>
                  {Math.round(p.pct * 100)}% du max
                </div>
                <div style={{ ...styles.phaseCardDetail, marginTop: 4 }}>
                  Poly : 3×{compound[i]} · Iso : 3×{isolation[i]}
                </div>
                <div style={{ ...styles.phaseCardDetail, marginTop: 4 }}>
                  Semaines {i * 3 + 1}–{i * 3 + 3}
                </div>
                {active && (
                  <div style={{
                    marginTop: 8, fontSize: 11, fontWeight: 700,
                    color: p.color, background: p.color + "22",
                    borderRadius: 6, padding: "3px 8px", display: "inline-block"
                  }}>
                    ← EN COURS sem. {weekInPhase}/3
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ margin: "20px 20px 0", fontSize: 13, color: "#9997A8", lineHeight: 1.6 }}>
          <strong style={{ color: "#F0EEF6" }}>Comment ça marche</strong><br />
          Ton poids de référence (3×8) correspond à ~80% de ton max. L'app recalcule automatiquement les poids pour chaque phase. Mets à jour ton poids de base quand tu progresses.
        </div>
      </div>
    );
  }

  function renderSettings() {
    return (
      <div>
        <div style={{ padding: "20px 20px 0", fontSize: 20, fontWeight: 800 }}>
          Réglages
        </div>

        <div style={styles.settingsSection}>
          <div style={styles.settingsTitle}>Rappel changement de phase</div>
          <div style={styles.settingsCard}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Prochain changement</div>
              <div style={{ fontSize: 13, color: "#9997A8", marginTop: 2 }}>
                {formatDate(nextDate)} — dans {daysUntilNext()} jours
              </div>
              <div style={{ fontSize: 12, color: "#9997A8" }}>
                → Phase {PHASES[(phaseIdx + 1) % 4].name}
              </div>
            </div>
            <a href={getCalendarUrl()} target="_blank" rel="noreferrer" style={styles.calBtn}>
              📅 Ajouter
            </a>
          </div>
        </div>

        <div style={styles.settingsSection}>
          <div style={styles.settingsTitle}>Pause & Vacances</div>
          <div style={styles.settingsCard}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {pauseActive ? "🏖️ Pause active" : "Mettre en pause"}
              </div>
              <div style={{ fontSize: 13, color: "#9997A8", marginTop: 2 }}>
                {pauseActive
                  ? `Reprends quand tu es prêt — le cycle t'attendra`
                  : "Vacances, blessure, voyage…"}
              </div>
            </div>
            {pauseActive ? (
              <button style={styles.resumeBtn} onClick={resumeTraining}>
                Reprendre
              </button>
            ) : (
              <button style={styles.pauseBtn} onClick={() => setShowPauseModal(true)}>
                Pause
              </button>
            )}
          </div>
        </div>

        <div style={styles.settingsSection}>
          <div style={styles.settingsTitle}>Cycle</div>
          <div style={styles.settingsCard}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Redémarrer le cycle</div>
              <div style={{ fontSize: 13, color: "#9997A8", marginTop: 2 }}>
                Recommencer à la phase Endurance
              </div>
            </div>
            <button style={styles.dangerBtn} onClick={resetCycle}>
              Reset
            </button>
          </div>
        </div>

        <div style={styles.settingsSection}>
          <div style={styles.settingsTitle}>Légende</div>
          <div style={{ background: "#1A1A25", border: "1px solid #2A2A35", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <span style={styles.exType("compound")}>POLY = Polyarticulaire</span>
              <span style={styles.exType("isolation")}>ISO = Isolation</span>
            </div>
            <div style={{ fontSize: 12, color: "#9997A8", marginTop: 10, lineHeight: 1.6 }}>
              Les exercices poly (squat, traction, développé…) sont périodisés agressivement. Les exercices d'isolation restent sur des reps plus élevées pour protéger les articulations.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ fontSize: 13, color: "#9997A8", fontWeight: 600, letterSpacing: 1 }}>
          CYCLE FITNESS
        </div>
        <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: -1 }}>
          Ton entraînement
        </div>
      </div>

      {/* Phase Banner */}
      <div style={styles.phaseBar}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 28 }}>{phase.emoji}</span>
          <div>
            <div style={styles.phaseName}>{phase.name}</div>
            <div style={styles.phaseInfo}>
              Semaine {weekInPhase}/3 · {Math.round(phase.pct * 100)}% du max
            </div>
          </div>
        </div>
        <div style={styles.progressRow}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={styles.progressDot(i <= phaseIdx, phase.color)} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i < weekInPhase ? phase.color : "#2A2A35"
            }} />
          ))}
        </div>
      </div>

      {/* Week Tracker */}
      <div style={styles.weekTracker}>
        <div style={styles.weekTitle}>Cette semaine</div>
        <div style={styles.weekRow}>
          {getCurrentWeekDates().map((d, i) => {
            const today = new Date();
            const isToday = dateKey(d) === dateKey(today);
            const isFuture = d > today && !isToday;
            const isRest = i === 5 || i === 6; // Fri, Sat
            const isDone = sessionLog[dateKey(d)] !== undefined;
            const state = isDone ? "done" : "pending";
            return (
              <div key={i} style={styles.weekDayCol}>
                <span style={styles.weekDayLabel(isToday)}>{WEEKDAY_LABELS[i]}</span>
                <div
                  style={styles.weekDayCircle(state, isRest)}
                  onClick={() => !isRest && !isFuture && toggleSession(d)}
                >
                  {isDone ? "✓" : isRest ? "" : d.getDate()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pause banner */}
      {pauseActive && (
        <div style={styles.pauseBanner}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#FF9444" }}>🏖️ Pause active</div>
            <div style={{ fontSize: 12, color: "#9997A8" }}>Le cycle t'attend</div>
          </div>
          <button style={styles.resumeBtn} onClick={resumeTraining}>Reprendre →</button>
        </div>
      )}

      {/* Next phase alert */}
      {!pauseActive && (
        <div style={styles.nextAlert}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              Prochain changement dans <strong style={{ color: phase.color }}>{daysUntilNext()} jours</strong>
            </div>
            <div style={{ fontSize: 12, color: "#9997A8" }}>
              {formatDate(nextDate)} → {PHASES[(phaseIdx + 1) % 4].name}
            </div>
          </div>
          <a href={getCalendarUrl()} target="_blank" rel="noreferrer" style={styles.calBtn}>
            📅 Rappel
          </a>
        </div>
      )}

      {/* Content */}
      {activeTab === "today" && renderToday()}
      {activeTab === "program" && renderProgram()}
      {activeTab === "settings" && renderSettings()}

      {/* Pause Modal */}
      {showPauseModal && (
        <div style={styles.modal} onClick={() => setShowPauseModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalTitle}>🏖️ Pause vacances</div>
            <div style={{ fontSize: 14, color: "#9997A8", marginBottom: 16 }}>
              Combien de semaines vas-tu t'absenter ?
            </div>
            <select
              style={styles.select}
              value={pauseWeeksInput}
              onChange={e => setPauseWeeksInput(parseInt(e.target.value))}
            >
              {[1,2,3,4,5,6,7,8].map(w => (
                <option key={w} value={w}>{w} semaine{w > 1 ? "s" : ""}</option>
              ))}
            </select>
            <button
              style={{ ...styles.calBtn, width: "100%", display: "block", padding: "14px", fontSize: 15, textAlign: "center", borderRadius: 12 }}
              onClick={() => activatePause(pauseWeeksInput)}
            >
              Activer la pause
            </button>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <div style={styles.bottomNav}>
        <button style={styles.navBtn(activeTab === "today")} onClick={() => setActiveTab("today")}>
          <span style={styles.navIcon}>💪</span>
          <span>Séance</span>
        </button>
        <button style={styles.navBtn(activeTab === "program")} onClick={() => setActiveTab("program")}>
          <span style={styles.navIcon}>📊</span>
          <span>Programme</span>
        </button>
        <button style={styles.navBtn(activeTab === "settings")} onClick={() => setActiveTab("settings")}>
          <span style={styles.navIcon}>⚙️</span>
          <span>Réglages</span>
        </button>
      </div>
    </div>
  );
}
