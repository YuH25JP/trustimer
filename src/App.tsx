import { useState, useEffect, useCallback, useMemo } from "react";
import {
  initDatabase,
  sessionRepo,
  solveRepo,
  settingsRepo,
} from "./lib/db";
import { Session, Solve, TimerSettings, EventType, Penalty } from "./types";
import { generateScramble } from "./lib/scramble";
import { calculateSessionStats } from "./lib/stats";
import { useTimer } from "./hooks/useTimer";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { Header } from "./components/Header";
import { ScrambleDisplay } from "./components/ScrambleDisplay";
import { TimerDisplay } from "./components/TimerDisplay";
import { StatsPanel } from "./components/StatsPanel";
import { SolvesList } from "./components/SolvesList";
import { Toast } from "./components/Toast";
import "./App.css";

export function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [solves, setSolves] = useState<Solve[]>([]);
  const [settings, setSettings] = useState<TimerSettings>({
    inspectionEnabled: false,
    timerUpdateMode: "all",
    holdDurationMs: 300,
    currentSessionId: "default-session",
    timePrecision: 3,
  });
  const [currentScramble, setCurrentScramble] = useState<string>("");
  const [scrambleLoading, setScrambleLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTimeoutId, setToastTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [initialized, setInitialized] = useState(false);

  // Toast trigger helper
  const showToast = useCallback(
    (msg: string) => {
      if (toastTimeoutId) clearTimeout(toastTimeoutId);
      setToastMessage(msg);
      const tid = setTimeout(() => {
        setToastMessage(null);
      }, 2000);
      setToastTimeoutId(tid);
    },
    [toastTimeoutId]
  );

  // Clipboard copy helper
  const copyToClipboard = useCallback(
    (text: string) => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(
          () => showToast(`Copied: ${text}`),
          () => showToast("Failed to copy")
        );
      } else {
        showToast("Clipboard unavailable");
      }
    },
    [showToast]
  );

  // Current session object
  const currentSession = useMemo(() => {
    return (
      sessions.find((s) => s.id === currentSessionId) ||
      sessions[0] || {
        id: "default-session",
        name: "Main",
        event: "333" as EventType,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
    );
  }, [sessions, currentSessionId]);

  // Fetch a new scramble for current session's event
  const refreshScramble = useCallback(
    async (event?: EventType) => {
      const targetEvent = event || currentSession.event;
      setScrambleLoading(true);
      try {
        const scr = await generateScramble(targetEvent);
        setCurrentScramble(scr);
      } catch (err) {
        console.error("Scramble generation error:", err);
      } finally {
        setScrambleLoading(false);
      }
    },
    [currentSession.event]
  );

  // Load initial app data
  useEffect(() => {
    async function init() {
      await initDatabase();
      const loadedSettings = await settingsRepo.getSettings();
      setSettings(loadedSettings);

      const allSessions = await sessionRepo.getAll();
      setSessions(allSessions);

      const activeSession =
        allSessions.find((s) => s.id === loadedSettings.currentSessionId) ||
        allSessions[0];

      if (activeSession) {
        setCurrentSessionId(activeSession.id);
        const sessionSolves = await solveRepo.getBySession(activeSession.id);
        setSolves(sessionSolves);
        await refreshScramble(activeSession.event);
      }
      setInitialized(true);
    }
    init();
  }, []);

  // Sync dark mode with document root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Handler: Solve finished
  const handleSolveFinished = useCallback(
    async (timeMs: number, penalty: Penalty) => {
      if (!currentSession.id) return;

      const finalTimeMs = penalty === "PLUS_TWO" ? timeMs + 2000 : timeMs;
      const newSolve = await solveRepo.add({
        sessionId: currentSession.id,
        timeMs: finalTimeMs,
        rawTimeMs: timeMs,
        penalty,
        scramble: currentScramble,
        comment: "",
        createdAt: Date.now(),
      });

      setSolves((prev) => [newSolve, ...prev]);
      // Generate next scramble
      refreshScramble(currentSession.event);
    },
    [currentSession.id, currentSession.event, currentScramble, refreshScramble]
  );

  // Timer hook
  const {
    timerState,
    displayTimeMs,
    inspectionSeconds,
    inspectionPenalty,
  } = useTimer({
    inspectionEnabled: settings.inspectionEnabled,
    holdDurationMs: settings.holdDurationMs,
    timerUpdateMode: settings.timerUpdateMode,
    onSolveFinished: handleSolveFinished,
    disabled: !initialized,
  });

  // Calculate session statistics
  const stats = useMemo(() => calculateSessionStats(solves), [solves]);

  // Handler: Change Session
  const handleSelectSession = useCallback(
    async (sessionId: string) => {
      setCurrentSessionId(sessionId);
      await settingsRepo.updateSettings({ currentSessionId: sessionId });
      setSettings((prev) => ({ ...prev, currentSessionId: sessionId }));

      const sessionSolves = await solveRepo.getBySession(sessionId);
      setSolves(sessionSolves);

      const session = sessions.find((s) => s.id === sessionId);
      if (session) {
        refreshScramble(session.event);
      }
    },
    [sessions, refreshScramble]
  );

  // Handler: Create Session
  const handleCreateSession = useCallback(
    async (name: string, event: EventType) => {
      const newSession = await sessionRepo.create(name, event);
      setSessions((prev) => [...prev, newSession]);
      handleSelectSession(newSession.id);
      showToast(`Session "${name}" created`);
    },
    [handleSelectSession, showToast]
  );

  // Handler: Change Event for current session
  const handleSelectEvent = useCallback(
    async (event: EventType) => {
      await sessionRepo.update(currentSession.id, currentSession.name, event);
      setSessions((prev) =>
        prev.map((s) => (s.id === currentSession.id ? { ...s, event } : s))
      );
      refreshScramble(event);
      showToast(`Switched event to ${event}`);
    },
    [currentSession, refreshScramble, showToast]
  );

  // Handler: Update Settings
  const handleUpdateSettings = useCallback(
    async (newSettings: Partial<TimerSettings>) => {
      await settingsRepo.updateSettings(newSettings);
      setSettings((prev) => ({ ...prev, ...newSettings }));
    },
    []
  );

  // Handler: Delete Solve
  const handleDeleteSolve = useCallback(
    async (id: string) => {
      await solveRepo.delete(id);
      setSolves((prev) => prev.filter((s) => s.id !== id));
      showToast("Solve deleted");
    },
    [showToast]
  );

  // Handler: Update Solve Penalty
  const handleUpdatePenalty = useCallback(
    async (id: string, penalty: Penalty) => {
      await solveRepo.updatePenalty(id, penalty);
      setSolves((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          const timeMs = penalty === "PLUS_TWO" ? s.rawTimeMs + 2000 : s.rawTimeMs;
          return { ...s, penalty, timeMs };
        })
      );
    },
    []
  );

  // Shortcuts: Delete latest solve
  const handleDeleteLastSolve = useCallback(() => {
    if (solves.length > 0) {
      handleDeleteSolve(solves[0].id);
    }
  }, [solves, handleDeleteSolve]);

  // Shortcuts: Toggle penalty on latest solve
  const handleTogglePenaltyLastSolve = useCallback(
    (penalty: Penalty) => {
      if (solves.length > 0) {
        handleUpdatePenalty(solves[0].id, penalty);
      }
    },
    [solves, handleUpdatePenalty]
  );

  // Global Keyboard Shortcuts
  const isTimerActive =
    timerState === "RUNNING" ||
    timerState === "HOLDING" ||
    timerState === "READY" ||
    timerState === "INSPECTING" ||
    timerState === "INSPECTION_HOLDING" ||
    timerState === "INSPECTION_READY";

  useKeyboardShortcuts({
    solves,
    onDeleteLastSolve: handleDeleteLastSolve,
    onTogglePenaltyLastSolve: handleTogglePenaltyLastSolve,
    onRefreshScramble: () => refreshScramble(),
    onCopyTime: copyToClipboard,
    isTimerActive,
    precision: settings.timePrecision || 3,
  });

  const lastSolvePenalty = solves.length > 0 ? solves[0].penalty : "NONE";

  return (
    <div className="h-screen w-screen flex flex-col justify-between bg-paper dark:bg-paper-dark text-sumi dark:text-paper overflow-hidden font-sans transition-colors duration-150">
      {/* Top Header */}
      <Header
        currentSession={currentSession}
        sessions={sessions}
        onSelectSession={handleSelectSession}
        onCreateSession={handleCreateSession}
        onSelectEvent={handleSelectEvent}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-between items-center py-2 px-4 max-w-5xl mx-auto w-full">
        {/* Scramble Text (hidden during solve in zen mode for focus) */}
        <div className={`transition-opacity duration-150 ${timerState === "RUNNING" ? "opacity-0" : "opacity-100"}`}>
          <ScrambleDisplay
            scramble={currentScramble}
            loading={scrambleLoading}
            onRefresh={() => refreshScramble()}
            onCopy={() => copyToClipboard(currentScramble)}
          />
        </div>

        {/* Central Timer */}
        <TimerDisplay
          timerState={timerState}
          displayTimeMs={displayTimeMs}
          inspectionSeconds={inspectionSeconds}
          inspectionPenalty={inspectionPenalty}
          timerUpdateMode={settings.timerUpdateMode}
          lastSolvePenalty={lastSolvePenalty}
          precision={settings.timePrecision || 3}
        />

        {/* Bottom Statistics and History (hidden during solve for focus) */}
        <div className={`w-full transition-opacity duration-150 ${timerState === "RUNNING" ? "opacity-0" : "opacity-100"}`}>
          <StatsPanel stats={stats} precision={settings.timePrecision || 3} />
          <SolvesList
            solves={solves}
            onDeleteSolve={handleDeleteSolve}
            onUpdatePenalty={handleUpdatePenalty}
            onCopyTime={copyToClipboard}
            precision={settings.timePrecision || 3}
          />
        </div>
      </main>

      {/* Subtle Toast notification */}
      <Toast message={toastMessage} />
    </div>
  );
}

export default App;
