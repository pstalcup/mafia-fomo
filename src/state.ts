import { bufferToFile, fileToBuffer } from "kolmafia";

export const STATE_FILE = "fomo.json";

export type MonthEntry = {
  id: number;
  name: string;
  bought: boolean;
  at: string;
};

export type State = {
  /** Item ids of every Mr. Accessory item fomo has seen for sale. */
  seen: number[];
  /** New items found each month, keyed by "YYYY-MM". */
  months: Record<string, MonthEntry[]>;
};

/** Returns the saved state, or null if there is no file yet (the first run). */
export function loadState(): State | null {
  const text = fileToBuffer(STATE_FILE).trim();
  if (!text) return null;

  let parsed: Partial<State>;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    // Don't guess: treating a broken file as a first run would forget what was already bought.
    throw new Error(`Could not read data/${STATE_FILE} (${e}). Fix it or delete it to start over.`);
  }
  return { seen: parsed.seen ?? [], months: parsed.months ?? {} };
}

export function saveState(state: State): void {
  if (!bufferToFile(JSON.stringify(state, null, 2), STATE_FILE)) {
    throw new Error(`Could not write data/${STATE_FILE}`);
  }
}

/** The current month as "YYYY-MM", from the game's date. */
export function monthKey(today: string): string {
  return `${today.slice(0, 4)}-${today.slice(4, 6)}`;
}
