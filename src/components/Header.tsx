import React, { useState } from "react";
import {
  Session,
  EventType,
  SUPPORTED_EVENTS,
  TimerSettings,
  TimerDisplayMode,
} from "../types";
import { Settings, Plus, Moon, Sun, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

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
        <img
          src="/trustimer_logo1.svg"
          alt="trusTimer"
          className="h-6 w-auto object-contain select-none"
        />

        <div className="h-4 w-px bg-sumi/20 dark:bg-white/20"></div>

        {/* Event Select with shadcn/ui */}
        <div className="w-36">
          <Select
            value={currentSession.event}
            onValueChange={(val) => onSelectEvent(val as EventType)}
          >
            <SelectTrigger className="h-8 text-xs font-mono">
              <SelectValue placeholder="Select event" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_EVENTS.map((ev) => (
                <SelectItem key={ev.id} value={ev.id}>
                  {ev.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Session selector & Action controls */}
      <div className="flex items-center gap-3">
        {/* Session Select & Add Button */}
        <div className="flex items-center gap-1.5">
          <div className="w-36">
            <Select
              value={currentSession.id}
              onValueChange={(val) => onSelectSession(val)}
            >
              <SelectTrigger className="h-8 text-xs font-mono">
                <SelectValue placeholder="Select session" />
              </SelectTrigger>
              <SelectContent>
                {currentEventSessions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={handleOpenNewSessionModal}
            title={`Create new session for ${currentSession.event}`}
            className="hover:text-vermilion"
          >
            <Plus size={16} />
          </Button>
        </div>

        <div className="h-4 w-px bg-sumi/20 dark:bg-white/20"></div>

        {/* Theme Toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={onToggleDarkMode}
          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </Button>

        {/* Settings Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowSettingsModal(true)}
          title="Settings"
        >
          <Settings size={16} />
        </Button>
      </div>

      {/* New Session Dialog with shadcn/ui */}
      <Dialog open={showNewSessionModal} onOpenChange={setShowNewSessionModal}>
        <DialogContent className="w-80 max-w-full" hideDefaultClose>
          <DialogHeader className="flex flex-row items-center justify-between border-b-1.5 border-sumi/10 dark:border-white/10 pb-3 space-y-0">
            <DialogTitle>New Session</DialogTitle>
            <DialogClose className="rounded p-1 text-sumi/60 dark:text-paper/60 hover:text-sumi dark:hover:text-paper transition-colors focus:outline-none focus:ring-1.5 focus:ring-vermilion cursor-pointer">
              <X size={16} />
              <span className="sr-only">Close</span>
            </DialogClose>
          </DialogHeader>
          <form onSubmit={handleCreateSessionSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-sumi/70 dark:text-paper/70 mb-1.5 font-sans">
                Session Name
              </label>
              <Input
                type="text"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                placeholder="e.g. 3x3 Practice"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-sumi/70 dark:text-paper/70 mb-1.5 font-sans">
                Event
              </label>
              <Select
                value={newSessionEvent}
                onValueChange={(val) => setNewSessionEvent(val as EventType)}
              >
                <SelectTrigger className="h-8 text-xs font-mono">
                  <SelectValue placeholder="Event" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_EVENTS.map((ev) => (
                    <SelectItem key={ev.id} value={ev.id}>
                      {ev.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewSessionModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="default">
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog with shadcn/ui */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="w-96 max-w-full space-y-4" hideDefaultClose>
          <DialogHeader className="flex flex-row items-center justify-between border-b-1.5 border-sumi/10 dark:border-white/10 pb-3 space-y-0">
            <DialogTitle>Settings</DialogTitle>
            <DialogClose className="rounded p-1 text-sumi/60 dark:text-paper/60 hover:text-sumi dark:hover:text-paper transition-colors focus:outline-none focus:ring-1.5 focus:ring-vermilion cursor-pointer">
              <X size={16} />
              <span className="sr-only">Close</span>
            </DialogClose>
          </DialogHeader>

          {/* Inspection Toggle with Switch */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="font-medium text-sm font-sans">WCA Inspection (15s)</div>
              <div className="text-xs text-sumi/60 dark:text-paper/60 font-sans">
                Audio & visual countdown with +2/DNF penalty
              </div>
            </div>
            <Switch
              checked={settings.inspectionEnabled}
              onCheckedChange={(checked) =>
                onUpdateSettings({ inspectionEnabled: checked })
              }
            />
          </div>

          {/* Timer Display Mode */}
          <div>
            <div className="font-medium text-sm mb-2 font-sans">
              Timer Display While Solving
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "all", label: "Realtime" },
                { id: "seconds", label: "Seconds" },
                { id: "none", label: "Zen (Hidden)" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() =>
                    onUpdateSettings({
                      timerUpdateMode: m.id as TimerDisplayMode,
                    })
                  }
                  className={`py-1.5 text-xs font-medium border-1.5 rounded transition-all duration-75 active:scale-[0.97] cursor-pointer ${
                    settings.timerUpdateMode === m.id
                      ? "border-vermilion bg-vermilion/10 text-vermilion font-semibold"
                      : "border-sumi/20 dark:border-white/20 hover:border-sumi dark:hover:border-white text-sumi/70 dark:text-paper/70"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time Precision */}
          <div>
            <div className="font-medium text-sm mb-2 font-sans">
              Time Precision (Decimals)
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: 3, label: "3 decimals (12.345 - ms)" },
                { val: 2, label: "2 decimals (12.34 - cs)" },
              ].map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() =>
                    onUpdateSettings({ timePrecision: p.val as 2 | 3 })
                  }
                  className={`py-1.5 px-2 text-xs font-medium border-1.5 rounded transition-all duration-75 active:scale-[0.97] cursor-pointer ${
                    (settings.timePrecision || 3) === p.val
                      ? "border-vermilion bg-vermilion/10 text-vermilion font-semibold"
                      : "border-sumi/20 dark:border-white/20 hover:border-sumi dark:hover:border-white text-sumi/70 dark:text-paper/70"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hold Duration with Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm font-sans">
                Hold to Start Duration
              </span>
              <span className="font-mono text-xs text-sumi/70 dark:text-paper/70">
                {settings.holdDurationMs}ms
              </span>
            </div>
            <Slider
              min={200}
              max={600}
              step={50}
              value={[settings.holdDurationMs]}
              onValueChange={(val) =>
                onUpdateSettings({ holdDurationMs: val[0] })
              }
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="default"
              onClick={() => setShowSettingsModal(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
};
