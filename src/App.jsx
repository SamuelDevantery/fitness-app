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
      { id: "d1e4", name: "Dips lestés", type: "compound", basePoids: 12.5, unit: "kg lest", baseReps: 8, bodyweightBased: true },
      { id: "d1e5", name: "Extensions triceps poulie", type: "isolation", basePoids: 18, unit: "kg", baseReps: 12 },
    ]
  },
  {
    id: 1, name: "Pull 1", muscles: "Dos · Biceps · Arrière épaule",
    exercises: [
      { id: "d2e1", name: "Tractions pronation", type: "compound", basePoids: 12.5, unit: "kg lest", baseReps: 8, bodyweightBased: true },
      { id: "d2e2", name: "Rowing barre courte", type: "compound", basePoids: 67.5, unit: "kg", baseReps: 8 },
      { id: "d2e3", name: "Reverse Butterfly", type: "isolation", basePoids: 52, unit: "kg", baseReps: 12 },
      { id: "d2e4", name: "Curl biceps poulie", type: "isolation", basePoids: 41, unit: "kg", baseReps: 12 },
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
      { id: "d4e4", name: "Dips lestés", type: "compound", basePoids: 12.5, unit: "kg lest", baseReps: 8, bodyweightBased: true },
      { id: "d4e5", name: "Extensions triceps poulie", type: "isolation", basePoids: 18, unit: "kg", baseReps: 12 },
    ]
  },
  {
    id: 4, name: "Pull 2", muscles: "Dos · Biceps · Arrière épaule",
    exercises: [
      { id: "d5e1", name: "Tractions pronation", type: "compound", basePoids: 12.5, unit: "kg lest", baseReps: 8, bodyweightBased: true },
      { id: "d5e2", name: "Tirage horizontal poulie", type: "compound", basePoids: 45, unit: "kg", baseReps: 10 },
      { id: "d5e3", name: "Reverse Butterfly", type: "isolation", basePoids: 52, unit: "kg", baseReps: 12 },
      { id: "d5e4", name: "Curl biceps poulie", type: "isolation", basePoids: 41, unit: "kg", baseReps: 12 },
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

// For bodyweight-based exercises (pull-ups, dips):
// basePoids = lest used at Force (3x8) reference. Total load at Force = bodyWeight + basePoids.
// We scale the TOTAL load proportionally across phases, then subtract bodyWeight to get
// the lest (positive) or assistance needed (negative) for each phase.
function calcBodyweightLoad(basePoids, phaseIdx, bodyWeight) {
  if (!bodyWeight) {
    return { totalLoad: null, lest: calcWeight(basePoids, phaseIdx), isAssisted: false };
  }
  const totalAtForce = bodyWeight + basePoids;
  const total1RM = totalAtForce / 0.80;
  const totalLoad = Math.round((total1RM * PHASES[phaseIdx].pct) * 4) / 4;
  const lest = Math.round((totalLoad - bodyWeight) * 4) / 4;
  return { totalLoad, lest, isAssisted: lest < 0 };
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
  const [sessionLog, setSessionLog] = useState({}); // { "2026-06-16": { dayIdx, rating, time } }
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionModalDate, setSessionModalDate] = useState(null);
  const [sessionModalStep, setSessionModalStep] = useState("pickDay"); // pickDay | rate
  const [sessionModalDayIdx, setSessionModalDayIdx] = useState(null);
  const [bodyWeights, setBodyWeights] = useState([]); // [{ date, kg }]
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [lastWeighInCycleCount, setLastWeighInCycleCount] = useState(0);
  const [exerciseOverrides, setExerciseOverrides] = useState({}); // { exId: { name?, type?, bodyweightBased? } }
  const [programMode, setProgramMode] = useState("periodized"); // "periodized" | "fixed3x8"
  const [sessionsPerPhase, setSessionsPerPhase] = useState(3); // per day-type, to advance phase
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [phaseSessionCounts, setPhaseSessionCounts] = useState({ 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 });
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [weightHistory, setWeightHistory] = useState([]); // [{ exId, date, oldVal, newVal }]
  const [overloadHandled, setOverloadHandled] = useState({}); // { dayIdx: lastConsideredDateKey }
  const [statsExId, setStatsExId] = useState(null); // exercise selected in the progression chart

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
      setBodyWeights(saved.bodyWeights || []);
      setLastWeighInCycleCount(saved.lastWeighInCycleCount ?? 0);
      setExerciseOverrides(saved.exerciseOverrides || {});
      setProgramMode(saved.programMode || "periodized");
      setSessionsPerPhase(saved.sessionsPerPhase || 3);
      if (saved.phaseIdx !== undefined) {
        setPhaseIdx(saved.phaseIdx);
      } else if (saved.cycleStart) {
        // One-time migration: keep the phase the old date-based system had you in
        const diffDays = Math.max(0, Math.floor((Date.now() - new Date(saved.cycleStart)) / 86400000));
        const eff = diffDays - (saved.pausedWeeks || 0) * 7;
        const dayInCycle = ((eff % 84) + 84) % 84;
        setPhaseIdx(Math.min(3, Math.floor(Math.floor(dayInCycle / 7) / 3)));
      }
      setPhaseSessionCounts(saved.phaseSessionCounts || { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 });
      setCyclesCompleted(saved.cyclesCompleted || 0);
      setWeightHistory(saved.weightHistory || []);
      setOverloadHandled(saved.overloadHandled || {});
    } else {
      setWeights(buildInitialWeights());
      setCycleStart(buildInitialStart());
    }
    setInitialized(true);
  }, []);

  // Save on change
  useEffect(() => {
    if (!initialized) return;
    saveState({
      weights, cycleStart, pausedWeeks, pauseActive, pauseStartDate, sessionLog, bodyWeights,
      lastWeighInCycleCount, exerciseOverrides, programMode, sessionsPerPhase, phaseIdx,
      phaseSessionCounts, cyclesCompleted, weightHistory, overloadHandled,
    });
  }, [weights, cycleStart, pausedWeeks, pauseActive, pauseStartDate, sessionLog, bodyWeights,
      lastWeighInCycleCount, exerciseOverrides, programMode, sessionsPerPhase, phaseIdx,
      phaseSessionCounts, cyclesCompleted, weightHistory, overloadHandled, initialized]);

  // ─── SESSION-BASED PHASE PROGRESSION ─────────────────────────────────────
  // A phase advances once each of the 5 day-types has been validated
  // `sessionsPerPhase` times (default 3 → 15 sessions total, e.g. Push/Pull/Legs/Push/Pull x3).
  const effectivePhaseIdx = programMode === "fixed3x8" ? 2 : phaseIdx;
  const phase = PHASES[effectivePhaseIdx];

  function remainingByDay() {
    return [0, 1, 2, 3, 4].map(i => Math.max(0, sessionsPerPhase - (phaseSessionCounts[i] || 0)));
  }

  function totalRemaining() {
    return remainingByDay().reduce((a, b) => a + b, 0);
  }

  function daysUntilNext() {
    // Rough estimate only (5 sessions/week nominal pace) — used just for an optional calendar entry
    const remaining = totalRemaining();
    return Math.ceil((remaining / 5) * 7);
  }

  function getEstimatedNextPhaseDate() {
    if (programMode === "fixed3x8") return null;
    const d = new Date();
    d.setDate(d.getDate() + daysUntilNext());
    return d;
  }

  const nextDate = getEstimatedNextPhaseDate();

  // Called after a session is validated with a day index — advances the phase when complete
  function registerSessionForPhaseProgress(dayIdx) {
    if (programMode === "fixed3x8" || dayIdx == null) return;
    setPhaseSessionCounts(prev => {
      const next = { ...prev, [dayIdx]: (prev[dayIdx] || 0) + 1 };
      const allDone = [0, 1, 2, 3, 4].every(i => (next[i] || 0) >= sessionsPerPhase);
      if (allDone) {
        setPhaseIdx(p => {
          const newPhase = (p + 1) % 4;
          if (newPhase === 0) setCyclesCompleted(c => c + 1);
          return newPhase;
        });
        return { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
      }
      return next;
    });
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

  const WEEKDAY_LABELS = ["D", "L", "M", "M", "J", "V", "S"];

  function openSessionModal(d) {
    const key = dateKey(d);
    setSessionModalDate(key);
    const existing = sessionLog[key];
    setSessionModalDayIdx(existing ? existing.dayIdx : null);
    setSessionModalStep("pickDay");
    setShowSessionModal(true);
  }

  function confirmSessionDay(dayIdx) {
    setSessionModalDayIdx(dayIdx);
    setSessionModalStep("rate");
  }

  function confirmSessionRating(rating) {
    const now = new Date();
    const existing = sessionLog[sessionModalDate];
    setSessionLog(prev => ({
      ...prev,
      [sessionModalDate]: {
        dayIdx: sessionModalDayIdx,
        rating,
        time: now.toISOString(),
      }
    }));
    if (!existing) {
      registerSessionForPhaseProgress(sessionModalDayIdx);
    } else if (existing.dayIdx !== sessionModalDayIdx) {
      setPhaseSessionCounts(prev => ({ ...prev, [existing.dayIdx]: Math.max(0, (prev[existing.dayIdx] || 0) - 1) }));
      registerSessionForPhaseProgress(sessionModalDayIdx);
    }
    setShowSessionModal(false);
    setSessionModalStep("pickDay");
  }

  function deleteSession() {
    const existing = sessionLog[sessionModalDate];
    setSessionLog(prev => {
      const next = { ...prev };
      delete next[sessionModalDate];
      return next;
    });
    if (existing && existing.dayIdx != null && programMode !== "fixed3x8") {
      setPhaseSessionCounts(prev => ({ ...prev, [existing.dayIdx]: Math.max(0, (prev[existing.dayIdx] || 0) - 1) }));
    }
    setShowSessionModal(false);
    setSessionModalStep("pickDay");
  }

  // ─── BODY WEIGHT TRACKING (re-weigh reminder every completed 12-week-equivalent cycle) ──
  function needsWeighIn() {
    if (programMode === "fixed3x8") return bodyWeights.length === 0;
    return lastWeighInCycleCount !== cyclesCompleted;
  }

  function logBodyWeight(kg) {
    const val = parseFloat(kg);
    if (isNaN(val) || val <= 0) return;
    setBodyWeights(prev => [...prev, { date: new Date().toISOString(), kg: val }]);
    setLastWeighInCycleCount(cyclesCompleted);
    setWeightInput("");
    setShowWeightModal(false);
  }

  function getLatestWeight() {
    if (bodyWeights.length === 0) return null;
    return bodyWeights[bodyWeights.length - 1];
  }

  // Merge a base exercise definition with any user customization (name, type, bodyweightBased)
  function getExerciseDef(ex) {
    const override = exerciseOverrides[ex.id];
    if (!override) return ex;
    return { ...ex, ...override };
  }

  function updateExerciseOverride(exId, patch) {
    setExerciseOverrides(prev => ({
      ...prev,
      [exId]: { ...(prev[exId] || {}), ...patch },
    }));
  }

  // Calendar event URL
  function getCalendarUrl() {
    if (!nextDate) return "#";
    const start = nextDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const end = new Date(nextDate.getTime() + 60 * 60 * 1000).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const nextPhase = PHASES[(effectivePhaseIdx + 1) % 4];
    const title = encodeURIComponent(`💪 (estimation) Changement phase fitness → ${nextPhase.name}`);
    const details = encodeURIComponent(`Estimation basée sur ton rythme habituel — vérifie dans l'app si tu es prêt à passer en phase ${nextPhase.name} (${Math.round(nextPhase.pct * 100)}% du max).`);
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
      const oldVal = weights[editingEx.id];
      setWeights(prev => ({ ...prev, [editingEx.id]: val }));
      if (oldVal !== val) {
        setWeightHistory(prev => [...prev, { exId: editingEx.id, date: new Date().toISOString(), oldVal, newVal: val }]);
      }
    }
    setEditingEx(null);
  }

  // ─── OVERLOAD SUGGESTION (autoregulation by perceived difficulty) ───────
  // If the last 2 logged sessions for a given day-type were both rated "easy" (1-2 stars),
  // suggest a modest load increase (~2.5%) for that day's exercises.
  function getLowDifficultyFlag(dayIdx) {
    const entries = Object.entries(sessionLog)
      .filter(([, e]) => e.dayIdx === dayIdx && e.rating != null)
      .sort((a, b) => new Date(b[0]) - new Date(a[0]));
    if (entries.length < 2) return null;
    const lastTwo = entries.slice(0, 2);
    const allLow = lastTwo.every(([, e]) => e.rating <= 2);
    if (!allLow) return null;
    const mostRecentKey = lastTwo[0][0];
    if (overloadHandled[dayIdx] === mostRecentKey) return null;
    return mostRecentKey;
  }

  function overloadSuggestionFor(dayIdx) {
    return getLowDifficultyFlag(dayIdx);
  }

  function applyDayOverload(dayIdx, apply) {
    const mostRecentKey = getLowDifficultyFlag(dayIdx);
    if (apply) {
      const day = DAYS[dayIdx];
      const now = new Date().toISOString();
      const updatedWeights = { ...weights };
      const historyEntries = [];
      day.exercises.forEach(ex => {
        const old = weights[ex.id] ?? ex.basePoids;
        const updated = Math.round(old * 1.025 * 4) / 4;
        updatedWeights[ex.id] = updated;
        historyEntries.push({ exId: ex.id, date: now, oldVal: old, newVal: updated });
      });
      setWeights(updatedWeights);
      setWeightHistory(prev => [...prev, ...historyEntries]);
    }
    if (mostRecentKey) {
      setOverloadHandled(prev => ({ ...prev, [dayIdx]: mostRecentKey }));
    }
  }

  function renderOverloadBanner(dayIdx) {
    return (
      <div style={{ background: "#16241A", border: "1px solid #4ECDC444", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#4ECDC4", marginBottom: 4 }}>💡 Ça semble facile</div>
        <div style={{ fontSize: 12, color: "#9997A8", marginBottom: 10, lineHeight: 1.5 }}>
          Les 2 dernières séances de {DAYS[dayIdx].name} étaient notées faciles (1-2★). D'après la littérature sur l'autorégulation (RPE), c'est le signal pour augmenter la charge.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => applyDayOverload(dayIdx, true)} style={{ ...styles.calBtn, flex: 1, textAlign: "center", padding: "10px" }}>
            Augmenter de 2.5%
          </button>
          <button onClick={() => applyDayOverload(dayIdx, false)} style={{ background: "none", border: "1px solid #2A2A35", color: "#9997A8", borderRadius: 8, padding: "10px", fontSize: 13, cursor: "pointer" }}>
            Ignorer
          </button>
        </div>
      </div>
    );
  }

  // ─── EXPORT / IMPORT ──────────────────────────────────────────────────────
  function exportData() {
    const data = loadState() || {};
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fitness-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        saveState(data);
        window.location.reload();
      } catch {
        alert("Fichier invalide — impossible d'importer ces données.");
      }
    };
    reader.readAsText(file);
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
    if (window.confirm("Revenir à la phase Endurance ? (tes stats et poids sont conservés)")) {
      setPhaseIdx(0);
      setPhaseSessionCounts({ 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 });
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
    dayPickerBtn: (active) => ({
      background: active ? phase.color : "#0F0F13",
      color: active ? "#0F0F13" : "#F0EEF6",
      border: `1px solid ${active ? phase.color : "#2A2A35"}`,
      borderRadius: 10,
      padding: "12px 14px",
      fontSize: 14,
      fontWeight: active ? 700 : 500,
      cursor: "pointer",
      width: "100%",
      marginBottom: 8,
      textAlign: "left",
    }),
    starRow: {
      display: "flex",
      gap: 10,
      justifyContent: "center",
      margin: "20px 0",
    },
    starBtn: (filled) => ({
      fontSize: 36,
      background: "none",
      border: "none",
      cursor: "pointer",
      opacity: filled ? 1 : 0.25,
      padding: 0,
    }),
    weightInput: {
      background: "#0F0F13",
      border: `1px solid ${phase.color}`,
      borderRadius: 10,
      color: "#F0EEF6",
      fontSize: 18,
      fontWeight: 700,
      padding: "12px 14px",
      width: "100%",
      marginBottom: 16,
      textAlign: "center",
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
    weekDayCircle: (isDone) => ({
      width: 34,
      height: 34,
      borderRadius: "50%",
      background: isDone ? phase.color : "#2A2A35",
      border: isDone ? `1px solid ${phase.color}` : "1px solid #2A2A35",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      fontSize: 15,
      fontWeight: 700,
      color: isDone ? "#0F0F13" : "#F0EEF6",
      transition: "all 0.15s",
    }),
  };

  const day = DAYS[selectedDay];

  function renderExercise(ex) {
    const userWeight = weights[ex.id] ?? ex.basePoids;
    const isEditing = editingEx?.id === ex.id;
    const machineW = ex.machineWeight || 0;
    const reps = getReps(effectivePhaseIdx, ex.type, ex.baseReps);

    // Bodyweight-based exercise (pull-ups, dips)
    if (ex.bodyweightBased) {
      const latestW = getLatestWeight();
      const bodyKg = latestW ? latestW.kg : null;
      const { totalLoad, lest, isAssisted } = calcBodyweightLoad(userWeight, effectivePhaseIdx, bodyKg);

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
              {!bodyKg ? (
                <>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#FF9444" }}>
                    Pèse-toi d'abord
                  </div>
                  <div style={styles.exUnit}>
                    Pour un calcul juste (poids du corps + lest)
                  </div>
                </>
              ) : isAssisted ? (
                <>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#4ECDC4" }}>
                    -{Math.abs(lest)} kg assistance
                  </div>
                  <div style={styles.exUnit}>
                    Charge totale {totalLoad} kg · utilise la machine assistée
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#F0EEF6" }}>
                    {lest} kg lest
                  </div>
                  <div style={styles.exUnit}>
                    Charge totale {totalLoad} kg (corps {bodyKg} + lest)
                  </div>
                </>
              )}
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#9997A8" }}>Lest base (3×8)</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{userWeight} kg</div>
            </div>
          </div>

          {!bodyKg && (
            <button
              style={{ ...styles.updateBtn, color: "#FF9444", borderColor: "#FF944444" }}
              onClick={() => setShowWeightModal(true)}
            >
              ⚖️ Enregistrer mon poids
            </button>
          )}

          {isEditing ? (
            <div style={styles.editRow}>
              <span style={styles.editLabel}>Nouveau lest (3×8) :</span>
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
              ✏️ Mettre à jour mon lest
            </button>
          )}
        </div>
      );
    }

    // Default rendering
    const phaseWeight = calcWeight(userWeight, effectivePhaseIdx);
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
          {overloadSuggestionFor(selectedDay) && renderOverloadBanner(selectedDay)}
          {day.exercises.map(ex => renderExercise(getExerciseDef(ex)))}
        </div>
      </div>
    );
  }

  function renderProgram() {
    if (programMode === "fixed3x8") {
      return (
        <div>
          <div style={{ padding: "20px 20px 0", fontSize: 20, fontWeight: 800 }}>
            Mode fixe — 3×8
          </div>
          <div style={{ margin: "16px 20px 0", fontSize: 13, color: "#9997A8", lineHeight: 1.6, background: "#1A1A25", border: "1px solid #2A2A35", borderRadius: 12, padding: "16px" }}>
            Pas de périodisation active : chaque exercice reste à son poids et ses reps de base (3×8 pour les poly). Change ça dans Réglages → Programme d'entraînement.
          </div>
        </div>
      );
    }

    const remaining = remainingByDay();
    return (
      <div>
        <div style={{ padding: "20px 20px 0", fontSize: 20, fontWeight: 800 }}>
          Cycle par séances ({cyclesCompleted} cycle{cyclesCompleted > 1 ? "s" : ""} complété{cyclesCompleted > 1 ? "s" : ""})
        </div>
        <div style={{ padding: "6px 20px 0", fontSize: 13, color: "#9997A8" }}>
          Une phase change quand chaque jour a été fait {sessionsPerPhase}× — pas de date fixe
        </div>

        <div style={styles.phaseGrid}>
          {PHASES.map((p, i) => {
            const active = i === phaseIdx;
            return (
              <div key={p.id} style={styles.phaseCard(p, active)}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{p.emoji}</div>
                <div style={styles.phaseCardName(p.color, active)}>{p.name}</div>
                <div style={styles.phaseCardDetail}>
                  {Math.round(p.pct * 100)}% du max
                </div>
                {active && (
                  <div style={{
                    marginTop: 8, fontSize: 11, fontWeight: 700,
                    color: p.color, background: p.color + "22",
                    borderRadius: 6, padding: "3px 8px", display: "inline-block"
                  }}>
                    ← EN COURS
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={styles.settingsSection}>
          <div style={styles.settingsTitle}>Progression vers la prochaine phase</div>
          <div style={{ background: "#1A1A25", border: "1px solid #2A2A35", borderRadius: 12, padding: "14px 16px" }}>
            {DAYS.map((d, i) => {
              const done = Math.min(sessionsPerPhase, phaseSessionCounts[i] || 0);
              return (
                <div key={d.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span>{d.name}</span>
                    <span style={{ color: done >= sessionsPerPhase ? phase.color : "#9997A8" }}>
                      {done}/{sessionsPerPhase} {done >= sessionsPerPhase ? "✓" : ""}
                    </span>
                  </div>
                  <div style={{ height: 6, background: "#0F0F13", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(done / sessionsPerPhase) * 100}%`, background: phase.color, borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ margin: "16px 20px 0", fontSize: 13, color: "#9997A8", lineHeight: 1.6 }}>
          <strong style={{ color: "#F0EEF6" }}>Comment ça marche</strong><br />
          Ton poids de référence (3×8) correspond à ~80% de ton max. L'app recalcule automatiquement les poids pour chaque phase. Mets à jour ton poids de base quand tu progresses.
        </div>
      </div>
    );
  }

  function renderSettings() {
    const chip = (active) => ({
      background: active ? phase.color : "#0F0F13",
      color: active ? "#0F0F13" : "#F0EEF6",
      border: `1px solid ${active ? phase.color : "#2A2A35"}`,
      borderRadius: 8,
      padding: "6px 12px",
      fontWeight: 700,
      fontSize: 12,
      cursor: "pointer",
    });

    return (
      <div>
        <div style={{ padding: "20px 20px 0", fontSize: 20, fontWeight: 800 }}>
          Réglages
        </div>

        {programMode !== "fixed3x8" && (
          <div style={styles.settingsSection}>
            <div style={styles.settingsTitle}>Prochain changement de phase</div>
            <div style={styles.settingsCard}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  Encore {totalRemaining()} séance{totalRemaining() > 1 ? "s" : ""}
                </div>
                <div style={{ fontSize: 12, color: "#9997A8", marginTop: 2 }}>
                  → Phase {PHASES[(phaseIdx + 1) % 4].name} (estimation ~{formatDate(nextDate)})
                </div>
              </div>
              <a href={getCalendarUrl()} target="_blank" rel="noreferrer" style={styles.calBtn}>
                📅 Estimation
              </a>
            </div>
          </div>
        )}

        <div style={styles.settingsSection}>
          <div style={styles.settingsTitle}>Programme d'entraînement</div>
          <div style={{ background: "#1A1A25", border: "1px solid #2A2A35", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Mode</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button style={chip(programMode === "periodized")} onClick={() => setProgramMode("periodized")}>
                Périodisé (4 phases)
              </button>
              <button style={chip(programMode === "fixed3x8")} onClick={() => setProgramMode("fixed3x8")}>
                Fixe 3×8
              </button>
            </div>
            {programMode === "periodized" && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                  Séances par jour avant de changer de phase
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[2, 3, 4].map(n => (
                    <button key={n} style={chip(sessionsPerPhase === n)} onClick={() => setSessionsPerPhase(n)}>
                      {n}× ({n * 5} séances)
                    </button>
                  ))}
                </div>
              </div>
            )}
            {programMode === "periodized" && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Phase actuelle</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {PHASES.map((p, i) => (
                    <button
                      key={p.id}
                      style={chip(phaseIdx === i)}
                      onClick={() => {
                        if (phaseIdx !== i) {
                          setPhaseIdx(i);
                          setPhaseSessionCounts({ 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 });
                        }
                      }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, margin: "14px 0 8px" }}>
                  Séances déjà faites dans cette phase
                </div>
                {DAYS.map((d, i) => (
                  <div key={d.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13 }}>{d.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button
                        style={chip(false)}
                        onClick={() => setPhaseSessionCounts(prev => ({ ...prev, [i]: Math.max(0, (prev[i] || 0) - 1) }))}
                      >
                        −
                      </button>
                      <span style={{ fontSize: 14, fontWeight: 700, minWidth: 34, textAlign: "center" }}>
                        {phaseSessionCounts[i] || 0}/{sessionsPerPhase}
                      </span>
                      <button
                        style={chip(false)}
                        onClick={() => setPhaseSessionCounts(prev => ({ ...prev, [i]: Math.min(sessionsPerPhase, (prev[i] || 0) + 1) }))}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
                <div style={{ fontSize: 11, color: "#9997A8", marginTop: 8, lineHeight: 1.5 }}>
                  Ajuste uniquement le suivi de phase : aucune séance n'est ajoutée à tes statistiques.
                </div>
              </div>
            )}
            <div style={{ fontSize: 11, color: "#9997A8", marginTop: 12, lineHeight: 1.5 }}>
              Changer de mode ne supprime aucune donnée ni statistique.
            </div>
          </div>
        </div>

        <div style={styles.settingsSection}>
          <div style={styles.settingsTitle}>Mes exercices</div>
          {DAYS.map(d => (
            <div key={d.id} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: phase.color, marginBottom: 6 }}>{d.name}</div>
              {d.exercises.map(baseEx => {
                const ex = getExerciseDef(baseEx);
                return (
                  <div key={ex.id} style={{ background: "#1A1A25", border: "1px solid #2A2A35", borderRadius: 12, padding: "10px 12px", marginBottom: 8 }}>
                    <input
                      style={{ ...styles.editInput, width: "100%", textAlign: "left", marginBottom: 8, boxSizing: "border-box", border: "1px solid #2A2A35" }}
                      value={ex.name}
                      onChange={e => updateExerciseOverride(ex.id, { name: e.target.value })}
                    />
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button style={chip(ex.type === "compound")} onClick={() => updateExerciseOverride(ex.id, { type: "compound" })}>POLY</button>
                      <button style={chip(ex.type === "isolation")} onClick={() => updateExerciseOverride(ex.id, { type: "isolation" })}>ISO</button>
                      <button style={chip(!!ex.bodyweightBased)} onClick={() => updateExerciseOverride(ex.id, { bodyweightBased: !ex.bodyweightBased })}>
                        {ex.bodyweightBased ? "Poids du corps ± lest/aide ✓" : "Poids du corps ± lest/aide"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div style={styles.settingsSection}>
          <div style={styles.settingsTitle}>Mes données</div>
          <div style={styles.settingsCard}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Sauvegarde</div>
              <div style={{ fontSize: 12, color: "#9997A8", marginTop: 2 }}>Pour changer d'appareil ou garder une copie</div>
            </div>
            <button style={styles.calBtn} onClick={exportData}>⬇️ Télécharger</button>
          </div>
          <div style={styles.settingsCard}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Restaurer</div>
              <div style={{ fontSize: 12, color: "#9997A8", marginTop: 2 }}>Remplace les données de cet appareil</div>
            </div>
            <label style={{ ...styles.pauseBtn, display: "inline-block" }}>
              ⬆️ Importer
              <input
                type="file"
                accept="application/json,.json"
                style={{ display: "none" }}
                onChange={e => { if (e.target.files[0]) importData(e.target.files[0]); }}
              />
            </label>
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
                  ? "Reprends quand tu es prêt — la phase n'avance qu'avec tes séances"
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
              <div style={{ fontSize: 14, fontWeight: 600 }}>Revenir à la phase Endurance</div>
              <div style={{ fontSize: 13, color: "#9997A8", marginTop: 2 }}>
                Tes stats et poids sont conservés
              </div>
            </div>
            <button style={styles.dangerBtn} onClick={resetCycle}>
              Reset
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderStats() {
    const entries = Object.entries(sessionLog); // [dateKey, {dayIdx, rating, time}]
    const totalSessions = entries.length;

    // Regularity: sessions in last 4 weeks vs expected (5/week)
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    const recentEntries = entries.filter(([key]) => new Date(key) >= fourWeeksAgo);
    const expectedRecent = 20; // 5/week * 4 weeks
    const regularityPct = Math.min(100, Math.round((recentEntries.length / expectedRecent) * 100));

    // Average rating
    const ratings = entries.map(([, e]) => e.rating).filter(r => r != null);
    const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null;

    // Rating by time of day (morning <12h, afternoon 12-18h, evening >18h)
    const buckets = { morning: [], afternoon: [], evening: [] };
    entries.forEach(([, e]) => {
      if (!e.time || e.rating == null) return;
      const hour = new Date(e.time).getHours();
      if (hour < 12) buckets.morning.push(e.rating);
      else if (hour < 18) buckets.afternoon.push(e.rating);
      else buckets.evening.push(e.rating);
    });
    const bucketAvg = (arr) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : null;

    // Sessions per day-type (which of the 5 days done most/least)
    const dayCounts = [0, 0, 0, 0, 0];
    entries.forEach(([, e]) => { if (e.dayIdx != null) dayCounts[e.dayIdx]++; });

    // Body weight trend
    const sortedWeights = [...bodyWeights].sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstW = sortedWeights[0];
    const lastW = sortedWeights[sortedWeights.length - 1];
    const weightDelta = firstW && lastW && firstW !== lastW ? (lastW.kg - firstW.kg).toFixed(1) : null;

    // Last 8 weeks regularity bar data
    const weeklyBuckets = [];
    for (let w = 7; w >= 0; w--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - w * 7 - weekStart.getDay());
      weekStart.setHours(0,0,0,0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const count = entries.filter(([key]) => {
        const d = new Date(key);
        return d >= weekStart && d < weekEnd;
      }).length;
      weeklyBuckets.push(count);
    }
    const maxWeekly = Math.max(5, ...weeklyBuckets);

    return (
      <div>
        <div style={{ padding: "20px 20px 0", fontSize: 20, fontWeight: 800 }}>
          Statistiques
        </div>

        {/* Regularity */}
        <div style={styles.settingsSection}>
          <div style={styles.settingsTitle}>Régularité (4 dernières semaines)</div>
          <div style={{ ...styles.settingsCard, flexDirection: "column", alignItems: "stretch" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: phase.color }}>{regularityPct}%</span>
              <span style={{ fontSize: 13, color: "#9997A8", alignSelf: "flex-end" }}>
                {recentEntries.length} / {expectedRecent} séances
              </span>
            </div>
            <div style={{ height: 8, background: "#0F0F13", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${regularityPct}%`, background: phase.color, borderRadius: 4 }} />
            </div>
          </div>
        </div>

        {/* Weekly bar chart */}
        <div style={styles.settingsSection}>
          <div style={styles.settingsTitle}>8 dernières semaines</div>
          <div style={{ background: "#1A1A25", border: "1px solid #2A2A35", borderRadius: 12, padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
              {weeklyBuckets.map((count, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{
                    width: "100%",
                    height: `${Math.max(4, (count / maxWeekly) * 64)}px`,
                    background: i === 7 ? phase.color : "#2A2A35",
                    borderRadius: 4,
                  }} />
                  <span style={{ fontSize: 9, color: "#9997A8" }}>{count}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "#9997A8", textAlign: "center", marginTop: 6 }}>
              il y a 8 sem. → cette semaine
            </div>
          </div>
        </div>

        {/* Average rating + time of day */}
        <div style={styles.settingsSection}>
          <div style={styles.settingsTitle}>Difficulté ressentie</div>
          <div style={styles.settingsCard}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Note moyenne</div>
              <div style={{ fontSize: 12, color: "#9997A8", marginTop: 2 }}>
                Sur {ratings.length} séance{ratings.length > 1 ? "s" : ""} notée{ratings.length > 1 ? "s" : ""}
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: phase.color }}>
              {avgRating ? `${avgRating} ⭐` : "—"}
            </div>
          </div>

          {(buckets.morning.length + buckets.afternoon.length + buckets.evening.length) > 0 && (
            <div style={{ background: "#1A1A25", border: "1px solid #2A2A35", borderRadius: 12, padding: "14px 16px", marginTop: 10 }}>
              <div style={{ fontSize: 12, color: "#9997A8", marginBottom: 10 }}>Difficulté moyenne par moment d'entraînement</div>
              {[
                { label: "🌅 Matin (avant 12h)", val: bucketAvg(buckets.morning), n: buckets.morning.length },
                { label: "☀️ Après-midi (12h-18h)", val: bucketAvg(buckets.afternoon), n: buckets.afternoon.length },
                { label: "🌙 Soir (après 18h)", val: bucketAvg(buckets.evening), n: buckets.evening.length },
              ].filter(b => b.n > 0).map((b, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13 }}>
                  <span>{b.label}</span>
                  <span style={{ fontWeight: 700 }}>{b.val} ⭐ <span style={{ color: "#9997A8", fontWeight: 400 }}>({b.n})</span></span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sessions per workout type */}
        <div style={styles.settingsSection}>
          <div style={styles.settingsTitle}>Répartition des séances</div>
          <div style={{ background: "#1A1A25", border: "1px solid #2A2A35", borderRadius: 12, padding: "14px 16px" }}>
            {DAYS.map((d, i) => {
              const maxCount = Math.max(1, ...dayCounts);
              return (
                <div key={d.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span>{d.name}</span>
                    <span style={{ color: "#9997A8" }}>{dayCounts[i]}</span>
                  </div>
                  <div style={{ height: 6, background: "#0F0F13", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(dayCounts[i] / maxCount) * 100}%`, background: phase.color, borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weight progression */}
        {(() => {
          const allEx = DAYS.flatMap(d => d.exercises.map(getExerciseDef));
          const nameOf = (id) => (allEx.find(e => e.id === id) || {}).name || id;
          const sorted = [...weightHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
          const idsWithHistory = [...new Set(sorted.map(h => h.exId))];

          // Global index: average % change vs each exercise's first recorded value
          const firstVal = {}; const cur = {}; const globalPts = [];
          sorted.forEach(h => {
            if (firstVal[h.exId] == null) firstVal[h.exId] = h.oldVal;
            cur[h.exId] = h.newVal;
            const ratios = Object.keys(cur).map(id => (cur[id] / firstVal[id] - 1) * 100);
            globalPts.push(ratios.reduce((a, b) => a + b, 0) / ratios.length);
          });
          const globalShown = globalPts.slice(-10);
          const gMax = Math.max(1, ...globalShown.map(Math.abs));

          const selId = statsExId && idsWithHistory.includes(statsExId) ? statsExId : idsWithHistory[0];
          const exHist = sorted.filter(h => h.exId === selId);
          const exPts = exHist.length ? [{ date: null, v: exHist[0].oldVal }, ...exHist.map(h => ({ date: h.date, v: h.newVal }))] : [];
          const exShown = exPts.slice(-10);
          const eMin = Math.min(...exShown.map(p => p.v));
          const eMax = Math.max(...exShown.map(p => p.v));

          return (
            <div style={styles.settingsSection}>
              <div style={styles.settingsTitle}>Progression des charges</div>
              {sorted.length === 0 ? (
                <div style={{ background: "#1A1A25", border: "1px solid #2A2A35", borderRadius: 12, padding: "14px 16px", fontSize: 13, color: "#9997A8", lineHeight: 1.5 }}>
                  Chaque fois que tu modifies un poids (ou acceptes une augmentation suggérée), il est daté ici. Les modifications passées ne sont pas récupérables : le suivi commence à partir de maintenant.
                </div>
              ) : (
                <>
                  <div style={{ background: "#1A1A25", border: "1px solid #2A2A35", borderRadius: 12, padding: "14px 16px", marginBottom: 10 }}>
                    <div style={{ fontSize: 12, color: "#9997A8", marginBottom: 10 }}>Global (variation moyenne des charges)</div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 70 }}>
                      {globalShown.map((v, i) => (
                        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                          <div style={{ width: "100%", height: `${Math.max(4, (Math.abs(v) / gMax) * 52)}px`, background: v >= 0 ? phase.color : "#FF6B6B", borderRadius: 4 }} />
                          <span style={{ fontSize: 9, color: "#9997A8" }}>{v > 0 ? "+" : ""}{v.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: "#1A1A25", border: "1px solid #2A2A35", borderRadius: 12, padding: "14px 16px" }}>
                    <select style={styles.select} value={selId} onChange={e => setStatsExId(e.target.value)}>
                      {idsWithHistory.map(id => <option key={id} value={id}>{nameOf(id)}</option>)}
                    </select>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
                      {exShown.map((pt, i) => (
                        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                          <div style={{
                            width: "100%",
                            height: `${eMax === eMin ? 40 : 16 + ((pt.v - eMin) / (eMax - eMin)) * 44}px`,
                            background: i === exShown.length - 1 ? phase.color : "#2A2A35",
                            borderRadius: 4,
                          }} />
                          <span style={{ fontSize: 9, color: "#9997A8" }}>{pt.v}</span>
                          <span style={{ fontSize: 8, color: "#6B6980" }}>{pt.date ? new Date(pt.date).toLocaleDateString("fr-FR", { day: "numeric", month: "numeric" }) : "départ"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {/* Body weight */}
        <div style={styles.settingsSection}>
          <div style={styles.settingsTitle}>Poids corporel</div>
          {bodyWeights.length === 0 ? (
            <div style={styles.settingsCard}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Aucune pesée enregistrée</div>
                <div style={{ fontSize: 12, color: "#9997A8", marginTop: 2 }}>Le matin à jeun, pour des résultats fiables</div>
              </div>
              <button style={styles.pauseBtn} onClick={() => setShowWeightModal(true)}>+ Ajouter</button>
            </div>
          ) : (
            <>
              <div style={styles.settingsCard}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Dernière pesée</div>
                  <div style={{ fontSize: 12, color: "#9997A8", marginTop: 2 }}>
                    {formatDate(new Date(lastW.date))}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: phase.color }}>{lastW.kg} kg</div>
                  {weightDelta && (
                    <div style={{ fontSize: 12, color: weightDelta > 0 ? "#FF6B6B" : "#4ECDC4" }}>
                      {weightDelta > 0 ? "+" : ""}{weightDelta} kg depuis le début
                    </div>
                  )}
                </div>
              </div>
              <button
                style={{ ...styles.updateBtn, marginLeft: 0, marginTop: 8 }}
                onClick={() => setShowWeightModal(true)}
              >
                ✏️ Ajouter une nouvelle pesée
              </button>
            </>
          )}
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
              {programMode === "fixed3x8"
                ? `Mode fixe · ${Math.round(phase.pct * 100)}% du max`
                : `${5 * sessionsPerPhase - totalRemaining()}/${5 * sessionsPerPhase} séances · ${Math.round(phase.pct * 100)}% du max`}
            </div>
          </div>
        </div>
        <div style={styles.progressRow}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={styles.progressDot(i <= effectivePhaseIdx, phase.color)} />
          ))}
        </div>
        {programMode !== "fixed3x8" && (
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} style={{
                flex: 1, height: 3, borderRadius: 2,
                background: (phaseSessionCounts[i] || 0) >= sessionsPerPhase ? phase.color : "#2A2A35"
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Week Tracker */}
      <div style={styles.weekTracker}>
        <div style={styles.weekTitle}>Cette semaine</div>
        <div style={styles.weekRow}>
          {getCurrentWeekDates().map((d, i) => {
            const today = new Date();
            const isToday = dateKey(d) === dateKey(today);
            const isFuture = d > today && !isToday;
            const entry = sessionLog[dateKey(d)];
            const isDone = !!entry;
            return (
              <div key={i} style={styles.weekDayCol}>
                <span style={styles.weekDayLabel(isToday)}>{WEEKDAY_LABELS[i]}</span>
                <div
                  style={styles.weekDayCircle(isDone)}
                  onClick={() => !isFuture && openSessionModal(d)}
                >
                  {isDone ? "✓" : d.getDate()}
                </div>
                {isDone && (
                  <span style={{ fontSize: 9, color: "#9997A8" }}>
                    {"★".repeat(entry.rating)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Weigh-in reminder */}
      {needsWeighIn() && (
        <div style={styles.pauseBanner}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#FF9444" }}>⚖️ Nouveau cycle</div>
            <div style={{ fontSize: 12, color: "#9997A8" }}>Pense à te repeser, le matin à jeun</div>
          </div>
          <button style={styles.resumeBtn} onClick={() => setShowWeightModal(true)}>Me peser</button>
        </div>
      )}

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
      {!pauseActive && programMode !== "fixed3x8" && (
        <div style={styles.nextAlert}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              Prochain changement dans <strong style={{ color: phase.color }}>{totalRemaining()} séance{totalRemaining() > 1 ? "s" : ""}</strong>
            </div>
            <div style={{ fontSize: 12, color: "#9997A8" }}>
              → {PHASES[(phaseIdx + 1) % 4].name}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {activeTab === "today" && renderToday()}
      {activeTab === "program" && renderProgram()}
      {activeTab === "stats" && renderStats()}
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

      {/* Session Entry Modal */}
      {showSessionModal && (
        <div style={styles.modal} onClick={() => setShowSessionModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            {sessionModalStep === "pickDay" ? (
              <>
                <div style={styles.modalTitle}>Quelle séance as-tu faite ?</div>
                <div style={{ fontSize: 13, color: "#9997A8", marginBottom: 16 }}>
                  {new Date(sessionModalDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                </div>
                {DAYS.map((d, i) => (
                  <button
                    key={d.id}
                    style={styles.dayPickerBtn(sessionModalDayIdx === i)}
                    onClick={() => confirmSessionDay(i)}
                  >
                    {d.name} — {d.muscles}
                  </button>
                ))}
                {sessionLog[sessionModalDate] && (
                  <button
                    style={{ ...styles.dangerBtn, width: "100%", marginTop: 8, padding: "10px" }}
                    onClick={deleteSession}
                  >
                    Supprimer cette validation
                  </button>
                )}
              </>
            ) : (
              <>
                <div style={styles.modalTitle}>Comment s'est passée la séance ?</div>
                <div style={{ fontSize: 13, color: "#9997A8", marginBottom: 8 }}>
                  {DAYS[sessionModalDayIdx]?.name} — note la difficulté ressentie
                </div>
                <div style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} style={styles.starBtn(true)} onClick={() => confirmSessionRating(n)}>
                      {"⭐"}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: "#9997A8", textAlign: "center" }}>
                  Touche l'étoile correspondant à ta note (1 = facile, 5 = très dur)
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Body Weight Modal */}
      {showWeightModal && (
        <div style={styles.modal} onClick={() => setShowWeightModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalTitle}>⚖️ Pesée du cycle</div>
            <div style={{ fontSize: 13, color: "#9997A8", marginBottom: 16, lineHeight: 1.6 }}>
              Pèse-toi le matin, à jeun, après les toilettes — c'est le moment le plus fiable pour suivre ta progression.
            </div>
            <input
              style={styles.weightInput}
              type="number"
              step="0.1"
              placeholder="Ton poids (kg)"
              value={weightInput}
              onChange={e => setWeightInput(e.target.value)}
              autoFocus
            />
            <button
              style={{ ...styles.calBtn, width: "100%", display: "block", padding: "14px", fontSize: 15, textAlign: "center", borderRadius: 12 }}
              onClick={() => logBodyWeight(weightInput)}
            >
              Enregistrer
            </button>
            <button
              style={{ background: "none", border: "none", color: "#9997A8", width: "100%", padding: "12px", fontSize: 13, cursor: "pointer" }}
              onClick={() => setShowWeightModal(false)}
            >
              Plus tard
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
        <button style={styles.navBtn(activeTab === "stats")} onClick={() => setActiveTab("stats")}>
          <span style={styles.navIcon}>📈</span>
          <span>Stats</span>
        </button>
        <button style={styles.navBtn(activeTab === "settings")} onClick={() => setActiveTab("settings")}>
          <span style={styles.navIcon}>⚙️</span>
          <span>Réglages</span>
        </button>
      </div>
    </div>
  );
}
