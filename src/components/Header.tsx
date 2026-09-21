import React, { useState } from "react";
import { Session, EventType, SUPPORTED_EVENTS, TimerSettings, TimerDisplayMode } from "../types";
import { Settings, Plus, Moon, Sun, X } from "lucide-react";

interface HeaderProps {
  currentSession: Session;
  sessions: Session[];
  onSelectSession: (id: string) => void;
  onCreateSession: (name: string, event: EventType) => void;
  onSelectEvent: (event: EventType) => void;
  settings: TimerSettings;
  onUpdateSettings: (settings: Partial<TimerSettings>) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSession,
  sessions,
  onSelectSession,
  onCreateSession,
  onSelectEvent,
  settings,
  onUpdateSettings,
  darkMode,
  onToggleDarkMode,
}) => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [newSessionEvent, setNewSessionEvent] = useState<EventType>("333");
  const currentEventSessions = sessions.filter(
    (s) => s.event === currentSession.event
  );

  const handleOpenNewSessionModal = () => {
    setNewSessionEvent(currentSession.event);
    setNewSessionName("");
    setShowNewSessionModal(true);
  };

  const handleCreateSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;
    onCreateSession(newSessionName.trim(), newSessionEvent);
    setNewSessionName("");
    setShowNewSessionModal(false);
  };

  return (
    <header className="w-full flex items-center justify-between px-6 py-3 border-b-1.5 border-sumi/10 dark:border-white/10 select-none bg-paper dark:bg-paper-dark transition-colors">
      {/* Brand & Event Selector */}
      <div className="flex items-center gap-4">
        <span className="font-bold tracking-tight text-lg flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-vermilion inline-block"></span>
          Trustimer
        </span>

        <div className="h-4 w-px bg-sumi/20 dark:bg-white/20"></div>

        {/* Event Select */}
        <select
          value={currentSession.event}
          onChange={(e) => onSelectEvent(e.target.value as EventType)}
          className="h-8 bg-paper dark:bg-paper-dark text-sumi dark:text-paper font-mono text-sm px-2.5 border-1.5 border-sumi/20 dark:border-white/20 rounded hover:border-sumi dark:hover:border-white cursor-pointer transition-colors focus:outline-none"
        >
          {SUPPORTED_EVENTS.map((ev) => (
            <option key={ev.id} value={ev.id} className="bg-paper dark:bg-[#1f1f23] text-sumi dark:text-paper font-mono">
              {ev.name}
            </option>
          ))}
        </select>
      </div>

      {/* Session selector & Action controls */}
      <div className="flex items-center gap-3">
        {/* Session Select & Add Button */}
        <div className="flex items-center gap-1.5">
          <select
            value={currentSession.id}
            onChange={(e) => onSelectSession(e.target.value)}
            className="h-8 bg-paper dark:bg-paper-dark text-sumi dark:text-paper font-mono text-sm px-2.5 border-1.5 border-sumi/20 dark:border-white/20 rounded hover:border-sumi dark:hover:border-white cursor-pointer transition-colors focus:outline-none max-w-[150px] truncate"
          >
            {currentEventSessions.map((s) => (
              <option key={s.id} value={s.id} className="bg-paper dark:bg-[#1f1f23] text-sumi dark:text-paper font-mono">
                {s.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleOpenNewSessionModal}
            title={`Create new session for ${currentSession.event}`}
            className="h-8 w-8 inline-flex items-center justify-center border-1.5 border-sumi/20 dark:border-white/20 rounded hover:border-sumi dark:hover:border-white hover:text-vermilion transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="h-4 w-px bg-sumi/20 dark:bg-white/20"></div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleDarkMode}
          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          className="h-8 w-8 inline-flex items-center justify-center border-1.5 border-sumi/20 dark:border-white/20 rounded hover:border-sumi dark:hover:border-white transition-colors"
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Settings Button */}
        <button
          onClick={() => setShowSettingsModal(true)}
          title="Settings"
          className="h-8 w-8 inline-flex items-center justify-center border-1.5 border-sumi/20 dark:border-white/20 rounded hover:border-sumi dark:hover:border-white transition-colors"
        >
          <Settings size={16} />
        </button>
      </div>

      {/* New Session Modal */}
      {showNewSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-paper dark:bg-sumi-dark border-1.5 border-sumi dark:border-paper rounded-lg p-6 w-80 max-w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-base">New Session</h3>
              <button
                onClick={() => setShowNewSessionModal(false)}
                className="text-sumi/60 dark:text-paper/60 hover:text-sumi dark:hover:text-paper"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateSessionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-sumi/70 dark:text-paper/70 mb-1">
                  Session Name
                </label>
                <input
                  type="text"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="e.g. 3x3 Practice"
                  className="w-full px-3 py-1.5 text-sm bg-transparent border-1.5 border-sumi/30 dark:border-white/30 rounded focus:border-sumi dark:focus:border-white focus:outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-sumi/70 dark:text-paper/70 mb-1">
                  Event
                </label>
                <select
                  value={newSessionEvent}
                  onChange={(e) => setNewSessionEvent(e.target.value as EventType)}
                  className="w-full px-3 py-1.5 text-sm bg-paper dark:bg-paper-dark text-sumi dark:text-paper border-1.5 border-sumi/30 dark:border-white/30 rounded focus:border-sumi dark:focus:border-white focus:outline-none"
                >
                  {SUPPORTED_EVENTS.map((ev) => (
                    <option key={ev.id} value={ev.id} className="bg-paper dark:bg-[#1f1f23] text-sumi dark:text-paper">
                      {ev.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewSessionModal(false)}
                  className="px-3 py-1.5 text-xs font-medium border-1.5 border-sumi/20 dark:border-white/20 rounded hover:border-sumi dark:hover:border-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-medium bg-sumi text-paper dark:bg-paper dark:text-sumi rounded hover:bg-vermilion dark:hover:bg-vermilion dark:hover:text-white transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-paper dark:bg-sumi-dark border-1.5 border-sumi dark:border-paper rounded-lg p-6 w-96 max-w-full space-y-5">
            <div className="flex items-center justify-between border-b-1.5 border-sumi/10 dark:border-white/10 pb-3">
              <h3 className="font-semibold text-base">Settings</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-sumi/60 dark:text-paper/60 hover:text-sumi dark:hover:text-paper"
              >
                <X size={18} />
              </button>
            </div>

            {/* Inspection */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">WCA Inspection (15s)</div>
                <div className="text-xs text-sumi/60 dark:text-paper/60">
                  Audio & visual countdown with +2/DNF penalty
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.inspectionEnabled}
                onChange={(e) => onUpdateSettings({ inspectionEnabled: e.target.checked })}
                className="w-4 h-4 accent-vermilion cursor-pointer"
              />
            </div>

            {/* Timer Display Mode */}
            <div>
              <div className="font-medium text-sm mb-1.5">Timer Display While Solving</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "all", label: "Realtime" },
                  { id: "seconds", label: "Seconds" },
                  { id: "none", label: "Zen (Hidden)" },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onUpdateSettings({ timerUpdateMode: m.id as TimerDisplayMode })}
                    className={`py-1.5 text-xs font-medium border-1.5 rounded transition-colors ${
                      settings.timerUpdateMode === m.id
                        ? "border-vermilion bg-vermilion/10 text-vermilion font-semibold"
                        : "border-sumi/20 dark:border-white/20 hover:border-sumi dark:hover:border-white"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Precision */}
            <div>
              <div className="font-medium text-sm mb-1.5">Time Precision (Decimals)</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: 3, label: "3 decimals (12.345 - ms)" },
                  { val: 2, label: "2 decimals (12.34 - cs)" },
                ].map((p) => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => onUpdateSettings({ timePrecision: p.val as 2 | 3 })}
                    className={`py-1.5 px-2 text-xs font-medium border-1.5 rounded transition-colors ${
                      (settings.timePrecision || 3) === p.val
                        ? "border-vermilion bg-vermilion/10 text-vermilion font-semibold"
                        : "border-sumi/20 dark:border-white/20 hover:border-sumi dark:hover:border-white"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Hold Duration */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-sm">Hold to Start Duration</span>
                <span className="font-mono text-xs text-sumi/70 dark:text-paper/70">
                  {settings.holdDurationMs}ms
                </span>
              </div>
              <input
                type="range"
                min={200}
                max={600}
                step={50}
                value={settings.holdDurationMs}
                onChange={(e) => onUpdateSettings({ holdDurationMs: parseInt(e.target.value, 10) })}
                className="w-full accent-vermilion cursor-pointer"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-1.5 text-xs font-medium bg-sumi text-paper dark:bg-paper dark:text-sumi rounded hover:bg-vermilion dark:hover:bg-vermilion dark:hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
