import ModelFactory from "../model/ModelFactory.js";

// Property constants
const ID = "date_id",
  EMOTIONS = "emotions",
  EMOTION = "emotion";

class DateController {
  constructor() {
    ModelFactory.getModel().then((model) => {
      this.model = model;
    });
  }

  /** Day Related Functions */

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
    const data = req.body;
    const dateData = await this.model.read(data[ID]);
    if (!dateData) {
      res.status(404).send("Date not found.");
      return;
    }
    res.json(dateData);
  }

  /** Emotion Related Functions */

  // Helper function to compare two emotion objects
  #isEqualEmotion(emotion1, emotion2) {
    return Object.keys(emotion1).every(
      (key) => emotion1[key] === emotion2[key]
    );
  }
  // Retrieve a specific day's emotion data
  // Request query parameters should be the date_id
  async getEmotionData(req, res) {
    const data = req.body;
    const dateData = await this.model.read(data[ID]);
    if (!dateData) {
      res.status(404).send("Date not found.");
      return;
    }
    res.json(dateData[EMOTIONS]);
  }
  // Retrieve a specific emotion log from a specific day
  // Request query parameters should be the date_id and the emotion object to retrieve
  async getEmotionLog(req, res) {
    const data = req.body;
    const dateData = await this.model.read(data[ID]);
    if (!dateData) {
      res.status(404).send("Date not found.");
      return;
    }
    const emotion = dateData[EMOTIONS].find((e) =>
      this.#isEqualEmotion(data[EMOTION], e)
    );
    res.json(emotion);
  }
  // Remove a specific emotion log from a specific day
  // Request query parameters should be the date_id and the emotion object to remove
  async removeEmotionLog(req, res) {
    const data = req.body;
    const dateData = await this.model.read(data[ID]);
    if (!dateData) {
      res.status(404).send("Date not found.");
      return;
    }
    const index = dateData[EMOTIONS].findIndex((e) => {
      return this.#isEqualEmotion(data[EMOTION], e);
    });
    if (index !== -1) {
      dateData[EMOTIONS].splice(index, 1);
      await this.model.update(dateData);
      res.json(dateData);
    } else {
      res.status(404).send("Emotion not found.");
    }
  }
  // Add a new emotion log to a specific day
  // Request query parameters should be the date_id and the emotion object to add
  async addEmotionLog(req, res) {
    const data = req.body;
    const dateData = await this.model.read(data[ID]);
    if (dateData) {
      if (
        !dateData[EMOTIONS].some((e) => this.#isEqualEmotion(data[EMOTION], e))
      ) {
        dateData[EMOTIONS].push(data[EMOTION]);
        await this.model.update(dateData);
        res.json(dateData);
      } else {
        res.status(400).send("Emotion already exists.");
      }
    } else {
      res.status(404).send("Date not found.");
    }
  }
  // Edit a specific emotion log from a specific day
  // Request body should contain the date_id and the emotion object to edit
  async editEmotionLog(req, res) {
    const data = req.body;
    const dateData = await this.model.read(data[ID]);
    if (!dateData) {
      res.status(404).send("Date not found.");
      return;
    }
    const index = dateData[EMOTIONS].findIndex((e) => {
      return this.#isEqualEmotion(data[EMOTION], e);
    });
    if (index !== -1) {
      dateData[EMOTIONS][index] = data[EMOTION];
      await this.model.update(dateData);
      res.json(dateData);
    } else {
      res.status(404).send("Emotion not found.");
    }
  }
}

export default DateController;
