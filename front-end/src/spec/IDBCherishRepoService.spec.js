import IDBCherishRepoService from "../services/IDBCherishRepoService.js";
import {
  IDBFactory,
  IDBKeyRange,
  IDBDatabase,
  IDBObjectStore,
  IDBTransaction,
  IDBCursor,
} from "fake-indexeddb";
import { Day } from "../utils/Day.js";
// Necessary to mock the indexedDB API
global.indexedDB = new IDBFactory();
global.IDBKeyRange = IDBKeyRange;
global.IDBDatabase = IDBDatabase;
global.IDBObjectStore = IDBObjectStore;
global.IDBTransaction = IDBTransaction;
global.IDBCursor = IDBCursor;

describe("IDBCherishRepoService", () => {
  let service;

  beforeEach(async () => {
    service = new IDBCherishRepoService();
    await service.initDB();
  });

  it("should initialize the database", async () => {
    expect(service.db).toBeDefined();
  });
  // Should successfully add a day to the database and then verify that it was added
  it("should add a day", async () => {
    const day = new Day("10-10-2024");
    await expectAsync(service.storeDay(day)).toBeResolvedTo(
      "Data Stored Successfully"
    );
    await expectAsync(service.restoreDay(day.date_id)).toBeResolvedTo(day);
  });
  // Should successfully update a day in the database and then verify that it was updated
  // e.g. update the rating of a day from 10 to 5 and then verify that the rating is 5
  it("should update a day with the same date_id", async () => {
    const day = new Day("10-10-2024");
    day.setRating(10);
    await expectAsync(service.storeDay(day)).toBeResolvedTo(
      "Data Stored Successfully"
    );
    const updatedDay = new Day("10-10-2024");
    updatedDay.setRating(5);
    await expectAsync(service.storeDay(updatedDay)).toBeResolvedTo(
      "Data Stored Successfully"
    );
    const restoredDay = await service.restoreDay(day.date_id);
    expect(restoredDay.date_id).toBe(day.date_id);
    expect(restoredDay.rating).toBe(5);
  });
  // Should successfully remove a day from the database and then verify that it was removed
  it("should remove a day", async () => {
    const day = new Day("10-10-2024");
    await expectAsync(service.storeDay(day)).toBeResolvedTo(
      "Data Stored Successfully"
    );
    await expectAsync(service.removeDay(day.date_id)).toBeResolvedTo(
      "Data Removed Successfully"
    );
    // Now that the day is removed, we should not be able to restore it
    await expectAsync(service.restoreDay(day.date_id)).toBeRejectedWith(null);
  });
  // Should successfully restore a day from the database and then verify that it was restored
  it("should restore a day", async () => {
    const day = new Day("10-10-2024");
    day.setRating(10);
    day.setJournal("journal");
    await expectAsync(service.storeDay(day)).toBeResolvedTo(
      "Data Stored Successfully"
    );
    const restoredDay = await service.restoreDay(day.date_id);
    expect(restoredDay.date_id).toBe(day.date_id);
    expect(restoredDay.rating).toBe(day.rating);
    expect(restoredDay.journal).toBe(day.journal);
  });
  // Should successfully clear the database, verify that it was cleared by attempting to restore a day (should throw)
  it("should clear the database", async () => {
    const day = new Day("10-10-2024");
    await expectAsync(service.storeDay(day)).toBeResolvedTo(
      "Data Stored Successfully"
    );
    await expectAsync(service.clearDatabase()).toBeResolvedTo(
      "Data Cleared Successfully"
    );
    await expectAsync(service.restoreDay(day.date_id)).toBeRejected();
  });
});
