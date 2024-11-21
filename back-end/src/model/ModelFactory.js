class _ModelFactory {
  async getModel(model = "local") {
    switch (model) {
      case "local":
        return new LocalModel();
      case "sqlite":
        return new SqLiteModel();
      case "sqlite-fresh":
        await SqLiteModel.init(true);
      default:
        throw new Error("Model not found");
    }
  }
}

const ModelFactory = new _ModelFactory();
export default ModelFactory;
