import Service from "./Service.js";
import { Events } from "../eventhub/Events.js";

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
      const response = await fetch("/v1/calendar");
      const data = await response.json();
      this.update(Events.InitDataSuccess, data);
    } catch (err) {
      this.update(Events.InitDataFailed, err);
      throw new Error("Failed to fetch calendar: " + err);
    }
  }

  async storeDay(data) {
    try {
      const response = await fetch("/v1/calendar/days", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      this.update(Events.StoredDataSuccess);
      return await response.json();
    } catch (err) {
      this.update(Events.StoredDataFailed, err);
      throw new Error("Failed to store day: " + err);
    }
  }

  async removeDay(id) {
    try {
      const response = await fetch(`/v1/calendar/days/${id}`, {
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
      const response = await fetch("/v1/calendar", {
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
