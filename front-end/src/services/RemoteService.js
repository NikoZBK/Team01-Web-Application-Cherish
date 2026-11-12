import { Events } from "../eventhub/Events.js";
import Service from "./Service.js";
import { debugLog } from "../config/debug.js";
import { getToday } from "../utils/dateUtils.js";
import { api, login, register } from "./api.js";

// The pages work with { date_id, rating, journal, emotions: [{ emotion_id,
// magnitude, description, timestamp }] }. These two functions are the only
// place that knows how the back end names the same things.
const toPageDay = (day) => ({
  date_id: day.date,
  rating: day.rating,
  journal: day.journal,
  emotions: day.emotions.map((entry) => ({
    emotion_id: entry.emotion,
    magnitude: entry.magnitude,
    description: entry.description,
    timestamp: entry.time,
  })),
});

const toApiDay = (day) => ({
  rating: Number(day.rating) || 0,
  journal: day.journal ?? "",
  emotions: (day.emotions ?? []).map((entry) => ({
    emotion: entry.emotion_id,
    magnitude: Number(entry.magnitude),
    description: entry.description ?? "",
    time: entry.timestamp ?? "",
  })),
});

/**
 * Stores and restores the signed-in user's days through the back end's REST
 * API. Who the user is comes from the session, never from a name in the URL.
 */
export class RemoteService extends Service {
  // Saves are sent one at a time, in the order they were made, so an older
  // save can never overwrite a newer one.
  #saving = Promise.resolve();

  addSubscriptions() {
    this.addEvent(Events.StoreData, (data) => this.storeDay(data));
    this.addEvent(Events.RestoreData, (id) => this.restoreDay(id));
    this.addEvent(Events.ClearData, () => this.clearDatabase());
  }

  /**
   * Restores one day. A date with nothing recorded comes back blank.
   * @param {string} date_id YYYY-MM-DD
   * @returns {Promise<Object>} the day's data
   */
  async restoreDay(date_id) {
    return toPageDay(await api("GET", `/days/${date_id}`));
  }

  /**
   * Restores every day the user has recorded, oldest first.
   * (Originally written by Jesse Goldman @jss4830)
   * @returns {Promise<Object[]>}
   */
  async restoreUserData() {
    try {
      const { items } = await api("GET", "/days");
      const days = items.map(toPageDay);
      this.update(Events.RestoredDataSuccess, days);
      return days;
    } catch (error) {
      this.update(Events.RestoredDataFailed);
      throw error;
    }
  }

  /**
   * Stores a day, replacing what was stored for its date.
   * (Originally written by Nikolay Ostroukhov @nikozbk, modified by @rthurston1)
   * @param {Object} day the day's data, including its date_id
   * @returns {Promise<Object|null>} the stored day, or null if it could not be stored
   */
  storeDay(day) {
    if (!day?.date_id) return Promise.resolve(null);
    const path = `/days/${day.date_id}`;
    const body = toApiDay(day); // snapshot now: the pages keep mutating `day`

    const saved = this.#saving.then(async () => {
      try {
        const stored = toPageDay(await api("PUT", path, body));
        this.update(Events.StoredDataSuccess, stored);
        return stored;
      } catch (error) {
        console.error("Error storing day:", error);
        this.update(Events.StoredDataFailed);
        return null;
      }
    });
    this.#saving = saved;
    return saved;
  }

  /**
   * Erases every day the user has recorded.
   * (Originally written by Nikolay Ostroukhov @nikozbk)
   */
  async clearDatabase() {
    try {
      await api("DELETE", "/days");
      this.update(Events.ClearedDataSuccess);
    } catch (error) {
      this.update(Events.ClearedDataFailed);
      throw error;
    }
  }

  /**
   * Creates an account and signs in.
   * (Originally written by Robbie Thurston @rthurston1)
   * @returns {Promise<Object>} what the pages need after login: username plus today's data
   */
  async registerUser(email, password) {
    return this.#enter(await register(email, password, email.split("@")[0].slice(0, 100) || email));
  }

  /**
   * Signs in.
   * (Originally written by Robbie Thurston @rthurston1)
   * @returns {Promise<Object>} what the pages need after login: username plus today's data
   */
  async loginUser(email, password) {
    return this.#enter(await login(email, password));
  }

  async #enter(user) {
    debugLog(`Signed in as ${user.displayName}`);
    return { ...(await this.restoreDay(getToday())), username: user.displayName };
  }
}
export default RemoteService;
