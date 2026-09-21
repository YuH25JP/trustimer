export type EventType =
  | "333"
  | "222"
  | "444"
  | "555"
  | "666"
  | "777"
  | "333oh"
  | "pyram"
  | "skewb"
  | "minx"
  | "sq1"
  | "clock";

export interface EventOption {
  id: EventType;
  name: string;
}

export const SUPPORTED_EVENTS: EventOption[] = [
  { id: "333", name: "3x3x3" },
  { id: "222", name: "2x2x2" },
  { id: "444", name: "4x4x4" },
  { id: "555", name: "5x5x5" },
  { id: "666", name: "6x6x6" },
  { id: "777", name: "7x7x7" },
  { id: "333oh", name: "3x3 OH" },
  { id: "pyram", name: "Pyraminx" },
  { id: "skewb", name: "Skewb" },
  { id: "minx", name: "Megaminx" },
  { id: "sq1", name: "Square-1" },
  { id: "clock", name: "Clock" },
];

export type Penalty = "NONE" | "PLUS_TWO" | "DNF";

export interface Session {
  id: string;
  name: string;
  event: EventType;
  createdAt: number;
  updatedAt: number;
}

export interface Solve {
  id: string;
  sessionId: string;
  timeMs: number;
  rawTimeMs: number;
  penalty: Penalty;
  scramble: string;
  comment: string;
  createdAt: number;
}

export type TimerDisplayMode = "all" | "seconds" | "none";

export interface TimerSettings {
  inspectionEnabled: boolean;
  timerUpdateMode: TimerDisplayMode;
  holdDurationMs: number;
  currentSessionId: string;
}

export type TimerState =
  | "IDLE"
  | "HOLDING"
  | "READY"
  | "INSPECTING"
  | "INSPECTION_HOLDING"
  | "INSPECTION_READY"
  | "RUNNING"
  | "STOPPED"
  | "COOLDOWN";
