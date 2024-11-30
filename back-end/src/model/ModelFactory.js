import LocalDayModel from "./LocalDayModel.js";
import SQLiteDayModel from "./SQLiteDayModel.js";

class _ModelFactory {
  async getModel(model = "local") {
    switch (model) {
      case "local":
        return LocalDayModel;
      case "sqlite":
        return SQLiteDayModel;
      case "sqlite-fresh":
        await SQLiteDayModel.init(true);
        return SQLiteDayModel;
      default:
        throw new Error("Model not found");
    }
  }
}

const ModelFactory = new _ModelFactory();
export default ModelFactory;
