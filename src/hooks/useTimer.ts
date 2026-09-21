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

  // Keep latest prop values in refs to avoid recreating callbacks and re-triggering effects
  const onSolveFinishedRef = useRef(onSolveFinished);
  onSolveFinishedRef.current = onSolveFinished;

  const inspectionEnabledRef = useRef(inspectionEnabled);
  inspectionEnabledRef.current = inspectionEnabled;

  const holdDurationMsRef = useRef(holdDurationMs);
  holdDurationMsRef.current = holdDurationMs;

  const timerUpdateModeRef = useRef(timerUpdateMode);
  timerUpdateModeRef.current = timerUpdateMode;

  // Refs for tracking timestamps and timers
  const startTimeRef = useRef<number>(0);
  const cooldownUntilRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Inspection tracking
  const inspectionStartRef = useRef<number>(0);
  const inspectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const beep8PlayedRef = useRef(false);
  const beep12PlayedRef = useRef(false);

  // Current state ref for synchronous event handling
  const stateRef = useRef(timerState);
  stateRef.current = timerState;

  const penaltyRef = useRef(inspectionPenalty);
  penaltyRef.current = inspectionPenalty;

  // Stop inspection timer
  const stopInspection = useCallback(() => {
    if (inspectionIntervalRef.current) {
      clearInterval(inspectionIntervalRef.current);
      inspectionIntervalRef.current = null;
    }
  }, []);

  // Animation frame loop for timer display
  const updateTimerLoop = useCallback(() => {
    const now = performance.now();
    const elapsed = now - startTimeRef.current;
    const mode = timerUpdateModeRef.current;

    if (mode === "all") {
      setDisplayTimeMs(Math.round(elapsed));
    } else if (mode === "seconds") {
      setDisplayTimeMs(Math.floor(elapsed / 1000) * 1000);
    }

    rafIdRef.current = requestAnimationFrame(updateTimerLoop);
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
    cooldownUntilRef.current = performance.now() + 300; // 300ms lockout

    const penalty = penaltyRef.current;
    onSolveFinishedRef.current(finalElapsedMs, penalty);

    // Transition back to IDLE after cooldown
    setTimeout(() => {
      setTimerState((prev) => (prev === "STOPPED" ? "IDLE" : prev));
      setInspectionPenalty("NONE");
    }, 300);
  }, []);

  // Start inspection
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
        // Exceeded 17s -> Automatic DNF
        stopInspection();
        setTimerState("STOPPED");
        setInspectionPenalty("DNF");
        cooldownUntilRef.current = performance.now() + 500;
        onSolveFinishedRef.current(0, "DNF");

        setTimeout(() => {
          setTimerState((prev) => (prev === "STOPPED" ? "IDLE" : prev));
          setInspectionPenalty("NONE");
        }, 500);
      } else {
        setInspectionSeconds(remaining);
      }
    }, 100);
  }, [stopInspection]);

  // Start solve
  const startSolve = useCallback(() => {
    stopInspection();
    setTimerState("RUNNING");
    startTimeRef.current = performance.now();
    setDisplayTimeMs(0);

    if (timerUpdateModeRef.current !== "none") {
      rafIdRef.current = requestAnimationFrame(updateTimerLoop);
    }
  }, [stopInspection, updateTimerLoop]);

  // Keyboard handlers
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore OS key repeat
      if (e.repeat) return;

      // Ignore if user is typing in an input or select
      const activeEl = document.activeElement as HTMLElement | null;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.tagName === "SELECT")
      ) {
        return;
      }

      // If active element is a button, blur it so Space doesn't re-trigger button click
      if (activeEl && activeEl.tagName === "BUTTON") {
        activeEl.blur();
      }

      let currentState = stateRef.current;

      // Self-healing: if stuck in STOPPED past the cooldown time, recover to IDLE
      if (currentState === "STOPPED" && performance.now() >= cooldownUntilRef.current) {
        currentState = "IDLE";
        setTimerState("IDLE");
      }

      // Any key stops timer when running
      if (currentState === "RUNNING") {
        e.preventDefault();
        stopSolve();
        return;
      }

      // Ignore keys during cooldown lockout
      if (performance.now() < cooldownUntilRef.current) {
        return;
      }

      // Space key actions
      if (e.code === "Space") {
        e.preventDefault();

        if (currentState === "IDLE") {
          setTimerState("HOLDING");
          holdTimeoutRef.current = setTimeout(() => {
            setTimerState("READY");
          }, holdDurationMsRef.current);
        } else if (currentState === "INSPECTING") {
          setTimerState("INSPECTION_HOLDING");
          holdTimeoutRef.current = setTimeout(() => {
            setTimerState("INSPECTION_READY");
          }, holdDurationMsRef.current);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;

      // Ignore if user is in input/select
      const activeEl = document.activeElement as HTMLElement | null;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.tagName === "SELECT")
      ) {
        return;
      }

      const currentState = stateRef.current;

      if (currentState === "HOLDING") {
        // Space released too early -> Cancel
        if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
        setTimerState("IDLE");
      } else if (currentState === "READY") {
        // Space released after ready
        if (inspectionEnabledRef.current) {
          startInspection();
        } else {
          startSolve();
        }
      } else if (currentState === "INSPECTION_HOLDING") {
        // Space released too early during inspection
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
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
      stopInspection();
    };
  }, [disabled, startInspection, startSolve, stopSolve, stopInspection]);

  return {
    timerState,
    displayTimeMs,
    inspectionSeconds,
    inspectionPenalty,
  };
}
