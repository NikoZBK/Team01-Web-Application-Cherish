import { Events } from "../eventhub/Events.js";
import Service from "./Service.js";

export class DatabaseService extends Service {
  constructor() {
    super();
    this.dbName = "cherishDB";
    this.storeName = "day";
    this.db = null;

    // Initialize the database
    this.initDB()
      .then(() => {
        this.addSubscriptions();
        console.log("Database events initialized")
      })
      .catch((error) => {
        console.error(error);
      });
  }

  addSubscriptions() {
    this.addEvent(Events.StoreData, (data) => this.storeDay(data));
    this.addEvent(Events.RestoreData, (id) => this.restoreDay(id));
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        db.createObjectStore(this.storeName, {keyPath: "date_id"});
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
        // If result is undefined creates new date object
        const obj = event.target.result ? event.target.result : {date_id: key};
        resolve(obj);
      };

      request.onerror = () => {
        this.update(Events.RestoredDataFailed)
        reject("Failed to retrieve data");
      }; 
    });
  }

  // Stores the day entry into the database 
  async storeDay(data) {
    const transaction = this.db.transaction([this.storeName], "readwrite");
    const objectStore = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = objectStore.put(data); // Updates entry if already exists, adds it otherwise
      request.onsuccess = (event) => {
        this.update(Events.StoredDataSuccess);
        resolve("Data Stored Successfully");
      };

      request.onerror = () => {
        this.update(Events.StoredDataFailed)
        reject("Failed to store data");
      };
    });
  }

  // Clears all Saved Data from the database
  async clearDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.dbName);

      request.onsuccess = () => {
        this.update(Events.ClearedDataSuccess);
        resolve("All Data Cleared!");
      };

      request.onerror = () => {
        this.update(Events.ClearedDataFailed);
        reject("Failed to Clear Data");
      }
    });
  }

}