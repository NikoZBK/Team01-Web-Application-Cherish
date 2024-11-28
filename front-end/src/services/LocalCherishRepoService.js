import { Events } from "../eventhub/Events.js";
import { Day } from "../utils/Day.js";
import Service from "./Service.js";

export class LocalCherishRepoService extends Service {
  constructor() {
    super();
    this.dbName = "cherishDB";
    this.storeName = "day";
    this.db = null;

    // Initialize the database
    this.initDB()
      .then(() => {
        this.addSubscriptions();
      })
      .catch((error) => {
        console.error(error);
      });
  }

  addSubscriptions() {
    this.addEvent(Events.StoreData, (data) => this.storeDay(data));
    this.addEvent(Events.RemoveData, (id) => this.removeDay(id));
    this.addEvent(Events.RestoreData, (id) => this.restoreDay(id));
    this.addEvent(Events.ClearData, () => this.clearDatabase());
    this.addEvent(Events.UpdateData, (data) => this.updateDay(data));
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        db.createObjectStore(this.storeName, { keyPath: "date_id" });
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.update(Events.InitDataSuccess);
        resolve(this.db);
      };

      request.onerror = (event) => {
        this.update(Events.InitDataFailed);
        reject(event.target.error);
      };
    });
  }

  // Returns the Day Object specified by the id
  async restoreDay(key) {
    const transaction = this.db.transaction([this.storeName], "readonly");
    const objectStore = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = objectStore.get(key);

      request.onsuccess = (event) => {
        const data = event.target.result;
        if (!data || Object.keys(data).length === 0) {
          this.update(Events.RestoredDataSuccess);
          resolve(new Day(key));
        } else {
          this.update(Events.RestoredDataSuccess);
          resolve(event.target.result);
        }
      };

      request.onerror = (event) => {
        const data = event.target.result;
        this.update(Events.RestoredDataFailed);
        reject("Failed to retrieve data");
      };
    });
  }

  // Stores the day entry into the database
  async storeDay(data) {
    const transaction = this.db.transaction([this.storeName], "readwrite");
    const objectStore = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = objectStore.put(data);
      request.onsuccess = () => {
        this.update(Events.StoredDataSuccess);
        resolve("Data Stored Successfully");
      };

      request.onerror = () => {
        this.update(Events.StoredDataFailed);
        reject("Failed to store data");
      };
    });
  }

  async removeDay(id) {
    const transaction = this.db.transaction([this.storeName], "readwrite");
    const objectStore = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = objectStore.delete(id);

      request.onsuccess = () => {
        this.update(Events.RemovedDataSuccess);
        resolve("Data Removed Successfully");
      };

      request.onerror = () => {
        this.update(Events.RemovedDataFailed);
        reject("Failed to remove data");
      };
    });
  }

  // async storeEmotion(data, emotion) {
  //   console.log("Storing Emotion");
  //   console.log("data: ", data);
  //   console.log("emotion: ", emotion);
  //   const day = data || { date_id: data.date_id, emotions: [] };
  //   day.emotions = day.emotions || [];
  //   day.emotions.push(emotion);
  //   const re this.storeDay(day)
  //     .then(() => {
  //       this.update(Events.StoreEmotionSuccess);
  //     })
  //     .catch(() => {
  //       this.update(Events.StoreEmotionFailed);
  //     });
  // }

  // Clears all Saved Data from the database
  async clearDatabase() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        const dbName = this.db.name;
        const openConnections = this.db._rawDatabase.connections;

        // Close all open connections
        openConnections.forEach((connection) => connection.close());

        const request = indexedDB.deleteDatabase(dbName);

        request.onsuccess = () => {
          this.update(Events.ClearedDataSuccess);
          resolve("Data Cleared Successfully");
        };

        request.onerror = () => {
          this.update(Events.ClearedDataFailed);
          reject("Failed to Clear Data");
        };

        request.onblocked = () => {
          this.update(Events.ClearedDataFailed);
          reject("Database deletion blocked");
        };
      } else {
        this.update(Events.ClearedDataFailed);
        reject("No database connection to clear");
      }
    });
  }
}
export default LocalCherishRepoService;
