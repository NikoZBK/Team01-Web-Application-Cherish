import ModelFactory from "../Model/ModelFactory.js";

class CalendarController {
  constructor() {
    ModelFactory.getModel().then((model) => {
      this.model = model;
    });
  }
}
