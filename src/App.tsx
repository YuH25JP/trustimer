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
import { GraphPanel } from "./components/GraphPanel";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
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
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [initialized, setInitialized] = useState(false);

  // Toast trigger helper using sonner
  const showToast = useCallback((msg: string) => {
    toast(msg);
  }, []);

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

  // Handler: Create Session (only created for the selected event)
  const handleCreateSession = useCallback(
    async (name: string, event: EventType) => {
      const newSession = await sessionRepo.create(name, event);
      setSessions((prev) => [...prev, newSession]);

      setCurrentSessionId(newSession.id);
      await settingsRepo.updateSettings({ currentSessionId: newSession.id });
      setSettings((prev) => ({ ...prev, currentSessionId: newSession.id }));

      const sessionSolves = await solveRepo.getBySession(newSession.id);
      setSolves(sessionSolves);
      refreshScramble(newSession.event);
      showToast(`Session "${name}" created for ${event}`);
    },
    [refreshScramble, showToast]
  );

  // Handler: Change Event (switches to that event's session, or creates Main if none exists)
  const handleSelectEvent = useCallback(
    async (newEvent: EventType) => {
      if (newEvent === currentSession.event) return;

      // Find existing sessions for this new event
      const eventSessions = sessions.filter((s) => s.event === newEvent);

      let targetSession: Session;
      if (eventSessions.length > 0) {
        targetSession = eventSessions[0];
      } else {
        // Create initial Main session for this new event
        targetSession = await sessionRepo.create("Main", newEvent);
        setSessions((prev) => [...prev, targetSession]);
      }

      setCurrentSessionId(targetSession.id);
      await settingsRepo.updateSettings({ currentSessionId: targetSession.id });
      setSettings((prev) => ({ ...prev, currentSessionId: targetSession.id }));

      const sessionSolves = await solveRepo.getBySession(targetSession.id);
      setSolves(sessionSolves);
      refreshScramble(newEvent);
      showToast(`Event: ${newEvent} (${targetSession.name})`);
    },
    [currentSession.event, sessions, refreshScramble, showToast]
  );

  // Handler: Update Settings (Optimistic update for 0ms instant UI response)
  const handleUpdateSettings = useCallback(
    (newSettings: Partial<TimerSettings>) => {
      setSettings((prev) => ({ ...prev, ...newSettings }));
      settingsRepo.updateSettings(newSettings).catch((err) => {
        console.error("Failed to update settings in DB:", err);
      });
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

        {/* Bottom Statistics, History and Graph (hidden during solve for focus) */}
        <div
          className={`w-full max-w-4xl mx-auto flex flex-col gap-2 transition-opacity duration-150 ${
            timerState === "RUNNING" ? "opacity-0" : "opacity-100"
          }`}
        >
          <StatsPanel stats={stats} precision={settings.timePrecision || 3} />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 px-6 h-52 sm:h-56">
            {/* Left: Solves List (Vertical) */}
            <div className="md:col-span-5 lg:col-span-4 h-full min-h-0">
              <SolvesList
                solves={solves}
                onDeleteSolve={handleDeleteSolve}
                onUpdatePenalty={handleUpdatePenalty}
                onCopyTime={copyToClipboard}
                precision={settings.timePrecision || 3}
              />
            </div>

            {/* Right: Graph Visualization */}
            <div className="md:col-span-7 lg:col-span-8 h-full min-h-0">
              <GraphPanel
                solves={solves}
                precision={settings.timePrecision || 3}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Subtle Toast notification */}
      <Toaster />
    </div>
  );
}

export default App;
