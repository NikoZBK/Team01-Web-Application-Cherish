import Service from "./Service.js";
import { Events } from "../eventhub/Events.js";
import { debugLog } from "../config/debug.js";

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
    this.addEvent(Events.RestoredDataFailed, (id) => this.storeDay(id));
    this.addEvent(Events.ClearData, () => this.clearDatabase());
    this.addEvent(Events.UpdateData, (data) => this.updateDay(data));
  }

  async _initCalendar() {
    try {
      debugLog("Fetching calendar data...");
      const response = await fetch("/v1/days");
      debugLog(`response: ${response}`);
      const data = await response.json();
      this.update(Events.InitDataSuccess, data);
    } catch (err) {
      this.update(Events.InitDataFailed, err);
      throw new Error("Failed to fetch calendar: " + err);
    }
  }

  async storeDay(data) {
    try {
      console.log(`Storing day: ${JSON.stringify(data)}`);
      const response = await fetch(
        `/v1/days/${typeof data === "string" ? data : data?.date_id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );
      this.update(Events.StoredDataSuccess);
      return await response.json();
    } catch (err) {
      this.update(Events.StoredDataFailed, err);
      throw new Error("Failed to store day: " + err);
    }
  }

  async restoreDay(id) {
    try {
      // ensure id is an object with a date_id property
      if (typeof id === "object") {
        id = id?.date_id;
      }

      console.log(`id=${id}`);

      const response = await fetch(`/v1/days/${id}`);

      // console.log("Response status:", response.status);
      // console.log("Response headers:", response.headers);
      // console.log("Response body used:", response.bodyUsed);

      if ((await response.text()) === "No data found.") {
        this.update(Events.RestoredDataFailed, "No data found.");
        return;
      }

      const text = await response.text();
      console.log("Response text:", text);

      const data = JSON.parse(text);
      console.log("Response data:", data);

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
