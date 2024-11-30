import ModelFactory from "../back-end/src/model/ModelFactory.js";
import LocalDayModel from "../back-end/src/model/LocalDayModel.js";
import SQLiteDayModel from "../back-end/src/model/SQLiteDayModel.js";

describe("ModelFactory", () => {
  it("should return an instance of LocalDayModel when model is 'local'", async () => {
    const model = await ModelFactory.getModel("local");
    expect(model).toBe(LocalDayModel);
  });

  it("should return an instance of SQLiteDayModel when model is 'sqlite'", async () => {
    const model = await ModelFactory.getModel("sqlite");
    expect(model).toBe(SQLiteDayModel);
  });

  it("should initialize SQLiteDayModel with fresh data when model is 'sqlite-fresh'", async () => {
    spyOn(SQLiteDayModel, "init").and.callThrough();
    const model = await ModelFactory.getModel("sqlite-fresh");
    expect(SQLiteDayModel.init).toHaveBeenCalledWith(true);
    expect(model).toBe(SQLiteDayModel);
  });

  it("should throw an error when model is not recognized", async () => {
    await expectAsync(ModelFactory.getModel("unknown")).toBeRejectedWithError(
      "Model not found"
    );
  });
});
