import { print, visitUrl } from "kolmafia";

import { args } from "./args";

function ntfyUrl(topic: string): string {
  // Accept either a bare topic (published to ntfy.sh) or a full URL for a self-hosted server
  const base = /^https?:\/\//.test(topic) ? topic : `https://ntfy.sh/${topic}`;
  return `${base.replace(/\/+$/, "")}/publish`;
}

/**
 * Send a push notification through ntfy if the ntfy arg (or fomo_ntfy pref) is set.
 * Uses ntfy's GET publish endpoint, as halfloop does, since KoLmafia form-encodes POST bodies.
 * Never throws: a failed notification should not stop the run.
 */
export function notify(message: string, failure = false): void {
  print(message, failure ? "red" : "blue");
  const topic = args.ntfy;
  if (!topic) return;

  const params: [string, string][] = [
    ["message", message],
    ["title", failure ? "fomo failed" : "fomo"],
    ["priority", failure ? "4" : "3"],
    ["tags", failure ? "warning" : "shopping_cart"],
  ];
  const query = params.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join("&");

  try {
    visitUrl(`${ntfyUrl(topic)}?${query}`, false, true);
  } catch (e) {
    print(`Failed to send ntfy notification: ${e}`, "red");
  }
}
