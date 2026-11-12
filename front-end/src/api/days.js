import { api } from "./client.js";

/**
 * A day is { date: "YYYY-MM-DD", rating, journal, emotions: [{ emotion,
 * magnitude, description, time }] }. They always belong to the signed-in user.
 */

/** One day; a date with nothing recorded comes back blank. */
export const getDay = (date) => api("GET", `/days/${date}`);

/** Recorded days, oldest first, within the inclusive range (either bound may be omitted). */
export async function listDays({ from, to } = {}) {
  const query = new URLSearchParams();
  if (from) query.set("from", from);
  if (to) query.set("to", to);
  const suffix = query.size > 0 ? `?${query}` : "";
  return (await api("GET", `/days${suffix}`)).items;
}

// Saves go out one at a time, in the order they were made, so an older save
// can never land after a newer one and overwrite it.
let queue = Promise.resolve();

/** Stores the whole day, replacing what was stored for its date. */
export function saveDay({ date, rating, journal, emotions }) {
  const saved = queue.then(() => api("PUT", `/days/${date}`, { rating, journal, emotions }));
  queue = saved.catch(() => undefined);
  return saved;
}

/** Erases everything the user has recorded. */
export const clearDays = () => api("DELETE", "/days");
