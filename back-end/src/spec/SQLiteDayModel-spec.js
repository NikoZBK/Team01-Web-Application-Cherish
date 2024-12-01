import SQLiteDayModel from "../model/SQLiteDayModel.js";
import { Day } from "../../../front-end/src/utils/Day.js";

describe("SQLiteDayModel CRUD Operations", () => {
  let model;

  beforeEach(async () => {
    model = SQLiteDayModel;
    await model.init(true); // Initialize with fresh data
  });

  it("should create a day", async () => {
    const day = new Day("10-10-2024");
    const dayTable = await model.create(day);
    expect(dayTable.get("date_id")).toEqual(day.date_id);
    expect(dayTable.get("rating")).toEqual(day.rating);
    expect(dayTable.get("journal")).toEqual(day.journal);
  });

  it("should read a day", async () => {
    const day = new Day("10-10-2024");
    await model.create(day);
    const readDay = await model.read(day.date_id);
    expect(readDay.date_id).toBe(day.date_id);
    expect(readDay.rating).toBe(day.rating);
    expect(readDay.journal).toBe(day.journal);
  });

  it("should update a day", async () => {
    const day = new Day("10-10-2024");
    await model.create(day);
    day.setRating(5);
    day.setJournal("Updated journal");
    await expectAsync(model.update(day)).toBeResolvedTo(day);
    const updatedDay = await model.read(day.date_id);
    expect(updatedDay.rating).toBe(5);
    expect(updatedDay.journal).toBe("Updated journal");
  });

  it("should delete a day", async () => {
    const day = new Day("10-10-2024");
    await model.create(day);
    await expectAsync(model.delete(day)).toBeResolvedTo(day);
    await expectAsync(model.read(day.date_id)).toBeResolvedTo(null);
  });

  it("should clear the database", async () => {
    const day = new Day("10-10-2024");
    await model.create(day);
    await expectAsync(model.delete()).toBeResolved();
    const allDays = await model.read();
    expect(allDays.length).toBe(0);
  });
});
