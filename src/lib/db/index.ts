import Database from "@tauri-apps/plugin-sql";
import { Session, Solve, TimerSettings, Penalty, EventType } from "../../types";

const DB_NAME = "sqlite:trustimer.db";

let dbInstance: Database | null = null;

// In-memory / localStorage fallback for non-Tauri / test environments
const mockStore = {
  sessions: [] as Session[],
  solves: [] as Solve[],
  settings: {} as Record<string, string>,
};

function isTauriEnvironment(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function getDb(): Promise<Database | null> {
  if (!isTauriEnvironment()) {
    return null;
  }
  if (!dbInstance) {
    dbInstance = await Database.load(DB_NAME);
  }
  return dbInstance;
}

export async function initDatabase(): Promise<void> {
  const db = await getDb();
  if (db) {
    // Enable WAL mode & foreign keys for SQLite
    await db.execute("PRAGMA foreign_keys = ON;");

    // Create tables
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        event TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS solves (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        time_ms INTEGER NOT NULL,
        raw_time_ms INTEGER NOT NULL,
        penalty TEXT NOT NULL,
        scramble TEXT NOT NULL,
        comment TEXT DEFAULT '',
        created_at INTEGER NOT NULL,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      );
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_solves_session ON solves(session_id, created_at DESC);
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // Ensure default session exists
    const sessions = await db.select<Array<{ id: string }>>("SELECT id FROM sessions LIMIT 1;");
    if (sessions.length === 0) {
      const defaultId = "default-session";
      const now = Date.now();
      await db.execute(
        "INSERT INTO sessions (id, name, event, created_at, updated_at) VALUES (?, ?, ?, ?, ?);",
        [defaultId, "Main", "333", now, now]
      );
      await db.execute(
        "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?);",
        ["current_session_id", defaultId]
      );
    }
  } else {
    // Initialize mock store from localStorage if available
    try {
      const savedSessions = localStorage.getItem("trustimer_mock_sessions");
      const savedSolves = localStorage.getItem("trustimer_mock_solves");
      const savedSettings = localStorage.getItem("trustimer_mock_settings");
      if (savedSessions) mockStore.sessions = JSON.parse(savedSessions);
      if (savedSolves) mockStore.solves = JSON.parse(savedSolves);
      if (savedSettings) mockStore.settings = JSON.parse(savedSettings);
    } catch {
      // ignore
    }

    if (mockStore.sessions.length === 0) {
      const defaultSession: Session = {
        id: "default-session",
        name: "Main",
        event: "333",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      mockStore.sessions.push(defaultSession);
      mockStore.settings["current_session_id"] = defaultSession.id;
      persistMock();
    }
  }
}

function persistMock() {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("trustimer_mock_sessions", JSON.stringify(mockStore.sessions));
      localStorage.setItem("trustimer_mock_solves", JSON.stringify(mockStore.solves));
      localStorage.setItem("trustimer_mock_settings", JSON.stringify(mockStore.settings));
    } catch {
      // ignore
    }
  }
}

// -------------------------------------------------------------
// Session Repository
// -------------------------------------------------------------
export const sessionRepo = {
  async getAll(): Promise<Session[]> {
    const db = await getDb();
    if (db) {
      const rows = await db.select<
        Array<{
          id: string;
          name: string;
          event: string;
          created_at: number;
          updated_at: number;
        }>
      >("SELECT id, name, event, created_at, updated_at FROM sessions ORDER BY created_at ASC;");
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        event: r.event as EventType,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
    }
    return [...mockStore.sessions];
  },

  async create(name: string, event: EventType = "333"): Promise<Session> {
    const session: Session = {
      id: crypto.randomUUID(),
      name,
      event,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const db = await getDb();
    if (db) {
      await db.execute(
        "INSERT INTO sessions (id, name, event, created_at, updated_at) VALUES (?, ?, ?, ?, ?);",
        [session.id, session.name, session.event, session.createdAt, session.updatedAt]
      );
    } else {
      mockStore.sessions.push(session);
      persistMock();
    }
    return session;
  },

  async update(id: string, name: string, event: EventType): Promise<void> {
    const now = Date.now();
    const db = await getDb();
    if (db) {
      await db.execute(
        "UPDATE sessions SET name = ?, event = ?, updated_at = ? WHERE id = ?;",
        [name, event, now, id]
      );
    } else {
      const target = mockStore.sessions.find((s) => s.id === id);
      if (target) {
        target.name = name;
        target.event = event;
        target.updatedAt = now;
        persistMock();
      }
    }
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    if (db) {
      await db.execute("DELETE FROM solves WHERE session_id = ?;", [id]);
      await db.execute("DELETE FROM sessions WHERE id = ?;", [id]);
    } else {
      mockStore.sessions = mockStore.sessions.filter((s) => s.id !== id);
      mockStore.solves = mockStore.solves.filter((s) => s.sessionId !== id);
      persistMock();
    }
  },
};

// -------------------------------------------------------------
// Solve Repository
// -------------------------------------------------------------
export const solveRepo = {
  async getBySession(sessionId: string): Promise<Solve[]> {
    const db = await getDb();
    if (db) {
      const rows = await db.select<
        Array<{
          id: string;
          session_id: string;
          time_ms: number;
          raw_time_ms: number;
          penalty: string;
          scramble: string;
          comment: string;
          created_at: number;
        }>
      >(
        "SELECT id, session_id, time_ms, raw_time_ms, penalty, scramble, comment, created_at FROM solves WHERE session_id = ? ORDER BY created_at DESC;",
        [sessionId]
      );
      return rows.map((r) => ({
        id: r.id,
        sessionId: r.session_id,
        timeMs: r.time_ms,
        rawTimeMs: r.raw_time_ms,
        penalty: r.penalty as Penalty,
        scramble: r.scramble,
        comment: r.comment || "",
        createdAt: r.created_at,
      }));
    }
    return mockStore.solves
      .filter((s) => s.sessionId === sessionId)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  async add(solve: Omit<Solve, "id">): Promise<Solve> {
    const newSolve: Solve = {
      ...solve,
      id: crypto.randomUUID(),
    };
    const db = await getDb();
    if (db) {
      await db.execute(
        `INSERT INTO solves (id, session_id, time_ms, raw_time_ms, penalty, scramble, comment, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          newSolve.id,
          newSolve.sessionId,
          newSolve.timeMs,
          newSolve.rawTimeMs,
          newSolve.penalty,
          newSolve.scramble,
          newSolve.comment || "",
          newSolve.createdAt,
        ]
      );
    } else {
      mockStore.solves.unshift(newSolve);
      persistMock();
    }
    return newSolve;
  },

  async updatePenalty(id: string, penalty: Penalty): Promise<void> {
    const db = await getDb();
    if (db) {
      const rows = await db.select<Array<{ raw_time_ms: number }>>(
        "SELECT raw_time_ms FROM solves WHERE id = ? LIMIT 1;",
        [id]
      );
      if (rows.length > 0) {
        const rawTime = rows[0].raw_time_ms;
        const newTimeMs = penalty === "PLUS_TWO" ? rawTime + 2000 : rawTime;
        await db.execute(
          "UPDATE solves SET penalty = ?, time_ms = ? WHERE id = ?;",
          [penalty, newTimeMs, id]
        );
      }
    } else {
      const target = mockStore.solves.find((s) => s.id === id);
      if (target) {
        target.penalty = penalty;
        target.timeMs = penalty === "PLUS_TWO" ? target.rawTimeMs + 2000 : target.rawTimeMs;
        persistMock();
      }
    }
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    if (db) {
      await db.execute("DELETE FROM solves WHERE id = ?;", [id]);
    } else {
      mockStore.solves = mockStore.solves.filter((s) => s.id !== id);
      persistMock();
    }
  },
};

// -------------------------------------------------------------
// Settings Repository
// -------------------------------------------------------------
export const settingsRepo = {
  async getSettings(): Promise<TimerSettings> {
    const defaultSettings: TimerSettings = {
      inspectionEnabled: false,
      timerUpdateMode: "all",
      holdDurationMs: 300,
      currentSessionId: "default-session",
    };

    const db = await getDb();
    if (db) {
      const rows = await db.select<Array<{ key: string; value: string }>>(
        "SELECT key, value FROM settings;"
      );
      const settingsMap = Object.fromEntries(rows.map((r) => [r.key, r.value]));

      return {
        inspectionEnabled: settingsMap["inspection_enabled"] === "true",
        timerUpdateMode: (settingsMap["timer_update_mode"] as any) || defaultSettings.timerUpdateMode,
        holdDurationMs: settingsMap["hold_duration_ms"]
          ? parseInt(settingsMap["hold_duration_ms"], 10)
          : defaultSettings.holdDurationMs,
        currentSessionId: settingsMap["current_session_id"] || defaultSettings.currentSessionId,
      };
    }

    return {
      inspectionEnabled: mockStore.settings["inspection_enabled"] === "true",
      timerUpdateMode: (mockStore.settings["timer_update_mode"] as any) || defaultSettings.timerUpdateMode,
      holdDurationMs: mockStore.settings["hold_duration_ms"]
        ? parseInt(mockStore.settings["hold_duration_ms"], 10)
        : defaultSettings.holdDurationMs,
      currentSessionId: mockStore.settings["current_session_id"] || defaultSettings.currentSessionId,
    };
  },

  async updateSettings(settings: Partial<TimerSettings>): Promise<void> {
    const db = await getDb();
    const pairs: [string, string][] = [];

    if (settings.inspectionEnabled !== undefined) {
      pairs.push(["inspection_enabled", String(settings.inspectionEnabled)]);
    }
    if (settings.timerUpdateMode !== undefined) {
      pairs.push(["timer_update_mode", settings.timerUpdateMode]);
    }
    if (settings.holdDurationMs !== undefined) {
      pairs.push(["hold_duration_ms", String(settings.holdDurationMs)]);
    }
    if (settings.currentSessionId !== undefined) {
      pairs.push(["current_session_id", settings.currentSessionId]);
    }

    if (db) {
      for (const [key, value] of pairs) {
        await db.execute(
          "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?);",
          [key, value]
        );
      }
    } else {
      for (const [key, value] of pairs) {
        mockStore.settings[key] = value;
      }
      persistMock();
    }
  },
};
