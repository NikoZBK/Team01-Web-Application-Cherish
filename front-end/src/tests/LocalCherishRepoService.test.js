import LocalCherishRepoService from "../services/LocalCherishRepoService";
import {
  IDBFactory,
  IDBKeyRange,
  IDBDatabase,
  IDBObjectStore,
  IDBTransaction,
  IDBCursor,
} from "fake-indexeddb";
import { Day } from "../utils/Day";

global.indexedDB = new IDBFactory();
global.IDBKeyRange = IDBKeyRange;
global.IDBDatabase = IDBDatabase;
global.IDBObjectStore = IDBObjectStore;
global.IDBTransaction = IDBTransaction;
global.IDBCursor = IDBCursor;

describe("LocalCherishRepoService", () => {
  let service;

  beforeEach(async () => {
    service = new LocalCherishRepoService();
    await service.initDB();
  });

  it("should initialize the database", async () => {
    expect(service.db).toBeDefined();
  });

  it("should add a day", async () => {
    const day = new Day();
    await expect(service.storeDay(day)).resolves.toEqual(
      "Data Stored Successfully"
    );
    await expect(service.restoreDay(day.date_id)).resolves.toEqual(day);
  });

  it("should remove a day", async () => {
    const day = new Day("10-10-24");
    day.setRating(10);
    await expect(service.storeDay(day)).resolves.toEqual(
      "Data Stored Successfully"
    );
    await expect(service.removeDay(day.date_id)).resolves.toEqual(
      "Data Removed Successfully"
    );
    // Now that the day is removed, we should not be able to restore it
    const restoredDay = await service.restoreDay(day.date_id);
    expect(restoredDay.date_id).toBe(day.date_id);
    expect(restoredDay.rating).toBe(0);
  });

  it("should restore a day", async () => {
    const day = new Day("10-10-24");
    day.setRating(10);
    day.setJournal("journal");
    await expect(service.storeDay(day)).resolves.toEqual(
      "Data Stored Successfully"
    );
    const restoredDay = await service.restoreDay(day.date_id);
    expect(restoredDay.date_id).toBe(day.date_id);
    expect(restoredDay.rating).toBe(day.rating);
    expect(restoredDay.journal).toBe(day.journal);
  });

  it("should clear the database", async () => {
    const day = new Day("10-10-24");
    await expect(service.storeDay(day)).resolves.toEqual(
      "Data Stored Successfully"
    );
    await expect(service.clearDatabase()).resolves.toEqual(
      "Data Cleared Successfully"
    );
    await expect(service.restoreDay(day.date_id)).rejects.toThrow();
  });
});
