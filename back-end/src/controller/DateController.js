import ModelFactory from "../model/ModelFactory.js";

// Property constants
const ID = "date_id",
  EMOTIONS = "emotions",
  EMOTION = "emotion";

// ********************************************************************************************************************
// * Note: The day related functions need to be passed the `date_id` in the request body                              *
// *       The emotion related functions need to be passed the `date_id` and the `emotion` object in the request body *
// ********************************************************************************************************************

class DateController {
  constructor() {
    ModelFactory.getModel()
      .then((model) => {
        this.model = model;
      })
      .catch((err) => console.error("Error initializing model: ", err));
  }

  /** Day Related Functions */

  // Retrieve all user's data
  // Request not used
  async getAllDateData(req, res) {
    try {
      const dateData = await this.model.read();
      if (!dateData) {
        return res.status(404).json({ error: "No data found." });
      }
      return res.json(dateData); // return all the data
    } catch (error) {
      return res.status(500).json({ error: "Internal server error." });
    }
  }

  // Retrieve a specific day's data
  // Request body should contain the `date_id`
  async getDateData(req, res) {
    try {
      const data = req.body;
      const dateData = await this.model.read(data[ID]);
      if (!dateData) {
        return res.status(404).json({ error: "No data found." });
      }
      return res.json(dateData);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error." });
    }
  }

  /** Emotion Related Functions */

  // Helper function to compare two emotion objects
  #isEqualEmotion(emotion1, emotion2) {
    if (emotion1 === emotion2) return true;
    if (!emotion1 || !emotion2) return false;
    return Object.keys(emotion1).every(
      (key) => emotion1[key] === emotion2[key]
    );
  }

  // Retrieve a specific day's emotion data
  // Request body should contain the `date_id`
  async getEmotionData(req, res) {
    try {
      const data = req.body;
      const dateData = await this.model.read(data[ID]);
      if (!dateData) {
        return res.status(404).json({ error: "No data found." });
      }
      return res.json(dateData[EMOTIONS] || []); // return the emotion data
    } catch (error) {
      return res.status(500).json({ error: "Internal server error." });
    }
  }

  // Retrieve a specific emotion log from a specific day
  // Request body should contain the `date_id` and the `emotion` object to retrieve
  async getEmotionLog(req, res) {
    try {
      const data = req.body;
      if (!data[EMOTION]) {
        return res.status(400).json({ error: "Emotion object is required." });
      }
      const dateData = await this.model.read(data[ID]);
      if (!dateData) {
        return res.status(404).json({ error: "No data found." });
      }
      const emotion = dateData[EMOTIONS]?.find((e) =>
        this.#isEqualEmotion(data[EMOTION], e)
      );
      return res.json(emotion); // return the emotion log
    } catch (error) {
      return res.status(500).json({ error: "Internal server error." });
    }
  }

  // Remove a specific emotion log from a specific day
  // Request body should contain the `date_id` and the `emotion` object to remove
  async removeEmotionLog(req, res) {
    try {
      const data = req.body;
      if (!data[EMOTION]) {
        return res.status(400).json({ error: "Emotion object is required." });
      }
      const dateData = await this.model.read(data[ID]);
      if (!dateData) {
        return res.status(404).json({ error: "No data found." });
      }
      const index = dateData[EMOTIONS]?.findIndex((e) => {
        return this.#isEqualEmotion(data[EMOTION], e);
      });
      if (index !== -1) {
        dateData[EMOTIONS].splice(index, 1);
        await this.model.update(dateData);
        return res.json(dateData); // return the updated date data
      } else {
        return res.status(404).json({ error: "Emotion not found." });
      }
    } catch (error) {
      return res.status(500).json({ error: "Internal server error." });
    }
  }

  // Add a new emotion log to a specific day
  // Request body should contain the `date_id` and the `emotion` object to add
  async addEmotionLog(req, res) {
    try {
      const data = req.body;
      if (!data[EMOTION]) {
        return res.status(400).json({ error: "Emotion object is required." });
      }
      const dateData = await this.model.read(data[ID]);
      if (dateData) {
        if (
          !dateData[EMOTIONS]?.some((e) =>
            this.#isEqualEmotion(data[EMOTION], e)
          ) // only push if emotion doesn't already exist
        ) {
          dateData[EMOTIONS].push(data[EMOTION]);
          await this.model.update(dateData);
          return res.json(dateData); // return the updated date data
        } else {
          return res.status(400).json({ error: "Emotion already exists." });
        }
      } else {
        return res.status(404).json({ error: "No data found." });
      }
    } catch (error) {
      return res.status(500).json({ error: "Internal server error." });
    }
  }

  // Edit a specific emotion log from a specific day
  // Request body should contain the `date_id` and the `emotion` object to edit
  async editEmotionLog(req, res) {
    try {
      const data = req.body;
      if (!data[EMOTION]) {
        return res.status(400).json({ error: "Emotion object is required." });
      }
      const dateData = await this.model.read(data[ID]);
      if (!dateData) {
        return res.status(404).json({ error: "No data found." });
      }
      const index = dateData[EMOTIONS]?.findIndex((e) => {
        return this.#isEqualEmotion(data[EMOTION], e);
      });
      if (index !== -1) {
        dateData[EMOTIONS][index] = data[EMOTION];
        await this.model.update(dateData);
        return res.json(dateData);
      } else {
        return res.status(404).json({ error: "Emotion not found." });
      }
    } catch (error) {
      return res.status(500).json({ error: "Internal server error." });
    }
  }
}

export default DateController;
