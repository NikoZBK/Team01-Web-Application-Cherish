import { Events } from "../eventhub/Events.js";
import { Day } from "../utils/Day.js";
import Service from "./Service.js";

export class IDBCherishRepoService extends Service {
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
        return new Error("Failed to initialize database: " + error);
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
  async restoreDay(id) {
    const transaction = this.db.transaction([this.storeName], "readonly");
    const objectStore = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = objectStore.get(id);

      request.onsuccess = (event) => {
        const data = event.target.result;

        if (data) {
          let day;
          try {
            day = new Day(
              data.date_id,
              data.emotions,
              data.rating,
              data.journal
            );
          } catch (error) {
            reject(new Error(error));
          }
          console.log("Restored day:", day);
          this.update(Events.RestoredDataSuccess);
          resolve(day);
        } else {
          this.update(Events.RestoredDataFailed);
          reject(null);
        }
      };

      request.onerror = () => {
        this.update(Events.RestoredDataFailed);
        reject(new Error(error));
      };
    });
  }

  // Stores the day entry into the database
  async storeDay(data) {
    // Ensure that the data is an instance of Day (to assert that it has the required properties)
    if (!(data instanceof Day)) {
      this.update(Events.StoredDataFailed);
      return Promise.reject(new Error("Data is not an instance of Day"));
    }

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
        reject(new Error("Failed to store data"));
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
        reject(new Error("Failed to remove data"));
      };
    });
  }

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
          reject(new Error("Failed to Clear Data"));
        };

        request.onblocked = () => {
          this.update(Events.ClearedDataFailed);
          reject(new Error("Database is blocked"));
        };
      } else {
        this.update(Events.ClearedDataFailed);
        reject(new Error("No database connection to clear"));
      }
    });
  }
}
export default IDBCherishRepoService;
