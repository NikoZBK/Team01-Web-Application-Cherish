import ModelFactory from "../model/ModelFactory.js";

// Property constants
const ID = "date_id",
  EMOTIONS = "emotions",
  EMOTION = "emotion";

// ********************************************************************************************************************
// * Note: The day related functions need to be passed the `date_id` in the request body                              *
// *       The emotion related functions need to be passed the `date_id` and the `emotion` object in the request body *
// ********************************************************************************************************************

class DayController {
  constructor() {
    ModelFactory.getModel()
      .then((model) => {
        this.model = model;
        console.log("Model initialized successfully:", model);
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
      return res.status(500).json({ error: error.message });
    }
  }

  // Retrieve a specific day's data
  // Request body should contain the `date_id`
  async getDateData(req, res) {
    try {
      const data = req.body;
      console.log("Request body:", data);

      const dateData = await this.model.read(data[ID]);
      console.log("Data retrieved from model:", dateData);

      if (!dateData) {
        console.log("No data found for date_id:", data[ID]);
        return res.status(404).json({ error: "No data found." });
      }
      return res.json(dateData);
    } catch (error) {
      console.error("Error in getDateData:", error.message);
      return res.status(500).json({ error: error.message });
    }
  }

  // Add a new day's data
  // Request body should contain the `date_id`
  async addDateData(req, res) {
    try {
      const data = req.body;
      console.log("Request body:", data);

      const dateData = await this.model.create(data);
      console.log("Data created successfully:", dateData);

      return res.json(dateData);
    } catch (error) {
      console.error("Error in addDateData:", error.message);
      return res.status(500).json({ error: error.message });
    }
  }

  // Remove a specific day's data
  // Request body should contain the `date_id`
  async removeDateData(req, res) {
    try {
      const data = req.body;
      console.log("Request body:", data);

      const dateData = await this.model.read(data[ID]);
      console.log("Data retrieved for date_id:", dateData);

      if (!dateData) {
        console.log("No data found for date_id:", data[ID]);
        return res.status(404).json({ error: "No data found." });
      }
      await this.model.delete(dateData);
      console.log("Data removed successfully:", dateData);

      return res.json(dateData);
    } catch (error) {
      console.error("Error in removeDateData:", error.message);
      return res.status(500).json({ error: error.message });
    }
  }

  // Remove all day data
  async clearDateData(req, res) {
    try {
      await this.model.delete();
      return res.json({});
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  /** Emotion Related Functions */

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
      return res.status(500).json({ error: error.message });
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
      return res.status(500).json({ error: error.message });
    }
  }

  // Remove a specific emotion log from a specific day
  // Request body should contain the `date_id` and the `emotion` object to remove
  async removeEmotionLog(req, res) {
    try {
      const data = req.body;
      console.log("Request body:", data);

      if (!data[EMOTION]) {
        console.log("Emotion object is missing from request body.");
        return res.status(400).json({ error: "Emotion object is required." });
      }
      const dateData = await this.model.read(data[ID]);
      console.log("Data retrieved for date_id:", dateData);

      if (!dateData) {
        console.log("No data found for date_id:", data[ID]);
        return res.status(404).json({ error: "No data found." });
      }
      const index = dateData[EMOTIONS]?.findIndex((e) => {
        return this.#isEqualEmotion(data[EMOTION], e);
      });

      console.log("Index of emotion to remove:", index);
      if (index !== -1) {
        dateData[EMOTIONS].splice(index, 1);
        await this.model.update(dateData);
        console.log("Emotion removed successfully. Updated data:", dateData);
        return res.json(dateData); // return the updated date data
      } else {
        console.log("Emotion not found:", data[EMOTION]);
        return res.status(404).json({ error: "Emotion not found." });
      }
    } catch (error) {
      console.error("Error in removeEmotionLog:", error.message);
      return res.status(500).json({ error: error.message });
    }
  }

  // Add a new emotion log to a specific day
  // Request body should contain the `date_id` and the `emotion` object to add
  async addEmotionLog(req, res) {
    try {
      const data = req.body;
      console.log("Request body:", data);
      if (!data[EMOTION]) {
        console.log("Emotion object is missing from request body.");

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
      return res.status(500).json({ error: error.message });
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
      return res.status(500).json({ error: error.message });
    }
  }

  // Helper function to compare two emotion objects
  #isEqualEmotion(emotion1, emotion2) {
    if (emotion1 === emotion2) return true;
    if (!emotion1 || !emotion2) return false;
    return Object.keys(emotion1).every(
      (key) => emotion1[key] === emotion2[key]
    );
  }
}

export default DayController;