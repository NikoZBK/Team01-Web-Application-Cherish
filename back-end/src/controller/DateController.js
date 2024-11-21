import ModelFactory from "../model/ModelFactory.js";

class DateController {
  constructor() {
    ModelFactory.getModel().then((model) => {
      this.model = model;
    });
  }
  // Helper function to compare two emotion objects
  #isEqualEmotion(emotion1, emotion2) {
    return Object.keys(emotion1).every(
      (key) => emotion1[key] === emotion2[key]
    );
  }

  // Retrieve all user's data
  // Request not used
  async getAllDateData(req, res) {
    const dateData = await this.model.read();
    if (!dateData) {
      res.status(404).send("No data found.");
      return;
    }
    res.json(dateData);
  }
  // Retrieve a specific day's data
  // Request query parameters should be the date_id
  async getDateData(req, res) {
    const { id } = req.params;
    const dateData = await this.model.read(id);
    if (!dateData) {
      res.status(404).send("Date not found.");
      return;
    }
    res.json(dateData);
  }
  // Retrieve a specific day's emotion data
  // Request query parameters should be the date_id
  async getEmotionData(req, res) {
    const { id } = req.params;
    const dateData = await this.model.read(id);
    if (!dateData) {
      res.status(404).send("Date not found.");
      return;
    }
    res.json(dateData.emotions);
  }
  // Retrieve a specific emotion log from a specific day
  // Request query parameters should be the date_id and the emotion object to retrieve
  async getEmotionLog(req, res) {
    const { id, emo } = req.params;
    const dateData = await this.model.read(id);
    if (!dateData) {
      res.status(404).send("Date not found.");
      return;
    }
    const emotion = dateData.emotions.find((e) => this.#isEqualEmotion(emo, e));
    res.json(emotion);
  }
  // Remove a specific emotion log from a specific day
  // Request query parameters should be the date_id and the emotion object to remove
  async removeEmotionLog(req, res) {
    const { id, emo } = req.params;
    const dateData = await this.model.read(id);
    if (!dateData) {
      res.status(404).send("Date not found.");
      return;
    }
    const index = dateData.emotions.findIndex((e) => {
      return this.#isEqualEmotion(emo, e);
    });
    dateData.emotions.splice(index, 1);
    await this.model.update(dateData);
    res.json(dateData);
  }
  // Add a new emotion log to a specific day
  // Request query parameters should be the date_id and the emotion object to add
  async addEmotionLog(req, res) {
    const { id, emo } = req.params;
    const dateData = await this.model.read(id);
    if (dateData) {
      if (!dateData.emotions.some((e) => this.#isEqualEmotion(emo, e))) {
        dateData.emotions.push(emo);
        await this.model.update(dateData);
        res.json(dateData);
      } else {
        res.status(400).send("Emotion already exists.");
      }
    } else {
      res.status(404).send("Date not found.");
    }
  }
}
