import { randomScrambleForEvent } from "cubing/scramble";
import { EventType } from "../types";

// Map our app's EventType to cubing.js event ID
function mapEventToCubing(event: EventType): string {
  switch (event) {
    case "333oh":
      return "333";
    case "minx":
      return "minx";
    case "pyram":
      return "pyram";
    case "skewb":
      return "skewb";
    case "sq1":
      return "sq1";
    case "clock":
      return "clock";
    default:
      return event;
  }
}

// Simple in-memory cache for prefetching next scramble
const prefetchCache = new Map<EventType, Promise<string>>();

export async function generateScramble(event: EventType): Promise<string> {
  const cachedPromise = prefetchCache.get(event);
  prefetchCache.delete(event);

  let scrambleStr: string;
  if (cachedPromise) {
    try {
      scrambleStr = await cachedPromise;
    } catch {
      scrambleStr = await fetchScrambleDirect(event);
    }
  } else {
    scrambleStr = await fetchScrambleDirect(event);
  }

  // Trigger prefetch for next solve of the same event
  prefetchNext(event);

  return scrambleStr;
}

async function fetchScrambleDirect(event: EventType): Promise<string> {
  const cubingEvent = mapEventToCubing(event);
  try {
    const alg = await randomScrambleForEvent(cubingEvent);
    return alg.toString();
  } catch (err) {
    console.error(`Failed to generate scramble for ${event}, falling back to basic random:`, err);
    return generateFallbackScramble(event);
  }
}

export function prefetchNext(event: EventType): void {
  prefetchCache.set(event, fetchScrambleDirect(event));
}

// Fallback generator in case cubing.js has an issue
function generateFallbackScramble(event: EventType): string {
  const moves333 = ["U", "D", "L", "R", "F", "B"];
  const modifiers = ["", "'", "2"];
  const length = event === "222" ? 10 : 21;
  const scramble: string[] = [];
  let lastAxis = -1;

  for (let i = 0; i < length; i++) {
    let axis = Math.floor(Math.random() * (moves333.length / 2));
    while (axis === lastAxis) {
      axis = Math.floor(Math.random() * (moves333.length / 2));
    }
    lastAxis = axis;
    const moveIndex = axis * 2 + Math.floor(Math.random() * 2);
    const mod = modifiers[Math.floor(Math.random() * modifiers.length)];
    scramble.push(`${moves333[moveIndex]}${mod}`);
  }
  return scramble.join(" ");
}
