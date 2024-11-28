import Service from "./Service.js";
import { Events } from "../eventhub/Events.js";

export class RemoteCherishRepoService extends Service {
  constructor() {
    super();
    this.#initCalendar();
  }
  // Add subscriptions to the event hub
  // TODO: Move these to a helper function (currently duplicated in LocalCherishRepoService)
  addSubscriptions() {
    this.addEvent(Events.StoreData, (data) => this.storeDay(data));
    this.addEvent(Events.RemoveData, (id) => this.removeDay(id));
    this.addEvent(Events.RestoreData, (id) => this.restoreDay(id));
    this.addEvent(Events.ClearData, () => this.clearDatabase());
    this.addEvent(Events.UpdateData, (data) => this.updateDay(data));
  }

  async #initCalendar() {
    const data = fetch("/calendar")
      .then((response) => response.json())
      .catch((err) => {
        this.update(Events.InitDataFailed, err);
        throw new Error("Failed to fetch calendar: " + err);
      });

    this.update(Events.InitDataSuccess, data);
  }

  async storeDay(data) {
    const response = fetch("/calendar/days", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        this.update(Events.StoredDataSuccess);
        return response.json();
      })
      .catch((err) => {
        this.update(Events.StoredDataFailed, err);
        throw new Error("Failed to store day: " + err);
      });

    this.update(Events.StoredDataSuccess, response);
  }

  async removeDay(id) {
    const response = fetch(`/calendar/days/${id}`, {
      method: "DELETE",
    })
      .then((response) => {
        this.update(Events.RemovedDataSuccess);
        return response.json();
      })
      .catch((err) => {
        this.update(Events.RemovedDataFailed, err);
        throw new Error("Failed to remove day: " + err);
      });

    this.update(Events.RemovedDataSuccess, response);
  }

  async clearCalendar() {
    const response = fetch("/calendar", {
      method: "DELETE",
    })
      .then((response) => {
        this.update(Events.ClearedDataSuccess);
        return response.json();
      })
      .catch((err) => {
        this.update(Events.ClearedDataFailed, err);
        throw new Error("Failed to clear calendar: " + err);
      });
  }
}
