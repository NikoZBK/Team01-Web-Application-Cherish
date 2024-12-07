import Service from "./Service.js";
import { Events } from "../eventhub/Events.js";
import { debugLog } from "../config/debug.js";
import { Day } from "../utils/Day.js";
import { cache, indexOfDayCache } from "./cache.js";

// Keep a cached copy of the calendar data

export class RemoteCherishRepoService extends Service {
  constructor() {
    super();
    this._initCalendar();
  }
  // Add subscriptions to the event hub
  // TODO: Move these to a helper function (currently duplicated in IDBCherishRepoService)
  addSubscriptions() {
    this.addEvent(Events.StoreData, (data) => this.storeDay(data));
    this.addEvent(Events.RemoveData, (id) => this.removeDay(id));
    this.addEvent(Events.RestoreData, (id) => this.restoreDay(id));
    this.addEvent(Events.ClearData, () => this.clearDatabase());
    this.addEvent(Events.UpdateData, (data) => this.updateDay(data));
  }

  async _initCalendar() {
    try {
      debugLog("Fetching calendar data...");
      const response = await fetch("/v1/days");
      debugLog(`response: ${response.status}`);
      const data = await response.json();
      data.forEach((day) => cache.push(JSON.stringify(day)));
      debugLog(`Setting the cache...`);
      // debug output the cache
      console.log(`cache: ${cache}`);
      this.update(Events.InitDataSuccess, data);
    } catch (err) {
      this.update(Events.InitDataFailed, err);
      throw new Error("Failed to fetch calendar: " + err);
    }
  }

  async getCachedData() {
    debugLog(`Returning cached data: ${cache}`);
    return cache;
  }

  async updateCachedData(data) {
    debugLog("Updating cached data...");
    console.log(`Updating cached data: ${data}`);
    if (!data) {
      debugLog("No data to update.");
      return;
    }
    if (indexOfDayCache(data.date_id) === -1) {
      // not in cache
      debugLog(`Pushing to cache: ${data.date_id}`);
      cache.push(data);
    } else {
      debugLog(`Updating cache: ${data.date_id}`);
      cache[indexOfDayCache(data.date_id)] = data; // update the cache
    }
  }

  async storeDay(data) {
    try {
      const date_id = data?.date_id || data; // check if data is an object or a string
      if (indexOfDayCache(date_id) === -1) {
        // not in cache
        debugLog(`Pushing to cache: ${date_id}`);
        cache.push(data);
      } else {
        debugLog(`Updating cache: ${date_id}`);
        cache[indexOfDayCache(date_id)] = data; // update the cache
      }

      const response = await fetch(`/v1/days/${date_id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cache),
      });
      console.log(`Storing day: ${date_id}`);
      this.update(Events.StoredDataSuccess);
      return await response.json();
    } catch (err) {
      this.update(Events.StoredDataFailed, err);
      throw new Error("Failed to store day: " + err);
    }
  }

  async restoreDay(id) {
    try {
      id = id?.date_id || id;
      let data;
      if (indexOfDayCache(id) !== -1) {
        // check cache first
        debugLog(`Returning cached day for ${id}`);
        data = cache[indexOfDayCache(id)];
        return data;
      }

      const response = await fetch(`/v1/days/${id}`);

      if (response.status === 404) {
        debugLog(`Creating new day for ${id}`);
        data = new Day(id);
      } else {
        debugLog(`Returning day for ${id}`);
        data = await response.json(); // should be an object
      }
      console.log("Response data:", data);
      cache[id] = data; // Update the cache

      this.update(Events.RestoredDataSuccess, data);
      return data;
    } catch (err) {
      this.update(Events.RestoredDataFailed, err);
      throw new Error(err ? err : "Failed to restore day: " + err);
    }
  }

  async removeDay(id) {
    try {
      const response = await fetch(`/v1/days/${id}`, {
        method: "DELETE",
      });
      this.update(Events.RemovedDataSuccess);
      return await response.json();
    } catch (err) {
      this.update(Events.RemovedDataFailed, err);
      throw new Error("Failed to remove day: " + err);
    }
  }

  async clearCalendar() {
    try {
      const response = await fetch("/v1/days/", {
        method: "DELETE",
      });
      this.update(Events.ClearedDataSuccess);
      return await response.json();
    } catch (err) {
      this.update(Events.ClearedDataFailed, err);
      throw new Error("Failed to clear calendar: " + err);
    }
  }
}

export default RemoteCherishRepoService;
