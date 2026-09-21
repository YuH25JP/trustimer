import { useState, useEffect, useRef, useCallback } from "react";
import { TimerState, Penalty, TimerDisplayMode } from "../types";
import { playBeep } from "../lib/audio";

interface UseTimerProps {
  inspectionEnabled: boolean;
  holdDurationMs: number;
  timerUpdateMode: TimerDisplayMode;
  onSolveFinished: (timeMs: number, penalty: Penalty) => void;
  disabled?: boolean;
}

export function useTimer({
  inspectionEnabled,
  holdDurationMs,
  timerUpdateMode,
  onSolveFinished,
  disabled = false,
}: UseTimerProps) {
  const [timerState, setTimerState] = useState<TimerState>("IDLE");
  const [displayTimeMs, setDisplayTimeMs] = useState(0);
  const [inspectionSeconds, setInspectionSeconds] = useState(15);
  const [inspectionPenalty, setInspectionPenalty] = useState<Penalty>("NONE");

  // Refs for tracking precise timestamps and animation frames
  const startTimeRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cooldownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Inspection tracking
  const inspectionStartRef = useRef<number>(0);
  const inspectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const beep8PlayedRef = useRef(false);
  const beep12PlayedRef = useRef(false);

  // Current state ref for event handlers to avoid stale closures
  const stateRef = useRef(timerState);
  stateRef.current = timerState;

  const penaltyRef = useRef(inspectionPenalty);
  penaltyRef.current = inspectionPenalty;

  // Clear all running timers
  const clearAllTimers = useCallback(() => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    if (cooldownTimeoutRef.current) clearTimeout(cooldownTimeoutRef.current);
    if (inspectionIntervalRef.current) clearInterval(inspectionIntervalRef.current);
  }, []);

  // Stop inspection
  const stopInspection = useCallback(() => {
    if (inspectionIntervalRef.current) {
      clearInterval(inspectionIntervalRef.current);
      inspectionIntervalRef.current = null;
    }
  }, []);

  // Stop running solve
  const stopSolve = useCallback(() => {
    const elapsed = performance.now() - startTimeRef.current;
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    const finalElapsedMs = Math.round(elapsed);
    setDisplayTimeMs(finalElapsedMs);
    setTimerState("STOPPED");

    const penalty = penaltyRef.current;
    onSolveFinished(finalElapsedMs, penalty);

    // Cooldown lockout to prevent accidental restart
    cooldownTimeoutRef.current = setTimeout(() => {
      setTimerState("IDLE");
      setInspectionPenalty("NONE");
    }, 300);
  }, [onSolveFinished]);

  // Inspection tick
  const startInspection = useCallback(() => {
    setTimerState("INSPECTING");
    inspectionStartRef.current = performance.now();
    beep8PlayedRef.current = false;
    beep12PlayedRef.current = false;
    setInspectionSeconds(15);
    setInspectionPenalty("NONE");

    inspectionIntervalRef.current = setInterval(() => {
      const elapsedMs = performance.now() - inspectionStartRef.current;
      const elapsedSec = Math.floor(elapsedMs / 1000);
      const remaining = 15 - elapsedSec;

      // 8s alert
      if (elapsedSec >= 8 && !beep8PlayedRef.current) {
        beep8PlayedRef.current = true;
        playBeep(520, 0.15);
      }
      // 12s alert
      if (elapsedSec >= 12 && !beep12PlayedRef.current) {
        beep12PlayedRef.current = true;
        playBeep(780, 0.15);
      }

      // Penalty zones
      if (remaining <= 0 && remaining >= -2) {
        setInspectionPenalty("PLUS_TWO");
        setInspectionSeconds(remaining);
      } else if (remaining < -2) {
        // Exceeded 17 seconds -> Automatic DNF
        stopInspection();
        setTimerState("STOPPED");
        setInspectionPenalty("DNF");
        onSolveFinished(0, "DNF");
        cooldownTimeoutRef.current = setTimeout(() => {
          setTimerState("IDLE");
          setInspectionPenalty("NONE");
        }, 500);
        return;
      } else {
        setInspectionSeconds(remaining);
      }
    }, 100);
  }, [onSolveFinished, stopInspection]);

  // Animation frame loop for timer display
  const updateTimerLoop = useCallback(() => {
    const now = performance.now();
    const elapsed = now - startTimeRef.current;

    if (timerUpdateMode === "all") {
      setDisplayTimeMs(Math.round(elapsed));
    } else if (timerUpdateMode === "seconds") {
      setDisplayTimeMs(Math.floor(elapsed / 1000) * 1000);
    } // if "none", do not update displayTimeMs during solve

    rafIdRef.current = requestAnimationFrame(updateTimerLoop);
  }, [timerUpdateMode]);

  // Start solve
  const startSolve = useCallback(() => {
    stopInspection();
    setTimerState("RUNNING");
    startTimeRef.current = performance.now();
    setDisplayTimeMs(0);

    if (timerUpdateMode !== "none") {
      rafIdRef.current = requestAnimationFrame(updateTimerLoop);
    }
  }, [stopInspection, timerUpdateMode, updateTimerLoop]);

  // Keyboard handlers
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore OS key repeats
      if (e.repeat) return;

      const currentState = stateRef.current;

      // Stop timer on any key when running
      if (currentState === "RUNNING") {
        e.preventDefault();
        stopSolve();
        return;
      }

      // Space key actions
      if (e.code === "Space") {
        e.preventDefault();

        if (currentState === "IDLE") {
          setTimerState("HOLDING");
          holdTimeoutRef.current = setTimeout(() => {
            setTimerState("READY");
          }, holdDurationMs);
        } else if (currentState === "INSPECTING") {
          setTimerState("INSPECTION_HOLDING");
          holdTimeoutRef.current = setTimeout(() => {
            setTimerState("INSPECTION_READY");
          }, holdDurationMs);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const currentState = stateRef.current;

      if (currentState === "HOLDING") {
        // Released space before hold duration completed
        if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
        setTimerState("IDLE");
      } else if (currentState === "READY") {
        // Space released after ready
        if (inspectionEnabled) {
          startInspection();
        } else {
          startSolve();
        }
      } else if (currentState === "INSPECTION_HOLDING") {
        // Released space before hold completed in inspection
        if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
        setTimerState("INSPECTING");
      } else if (currentState === "INSPECTION_READY") {
        // Start actual solve from inspection
        startSolve();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      clearAllTimers();
    };
  }, [
    disabled,
    holdDurationMs,
    inspectionEnabled,
    clearAllTimers,
    startInspection,
    startSolve,
    stopSolve,
  ]);

  return {
    timerState,
    displayTimeMs,
    inspectionSeconds,
    inspectionPenalty,
  };
}
