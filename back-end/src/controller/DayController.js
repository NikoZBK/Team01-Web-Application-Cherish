import ModelFactory from "../model/ModelFactory.js";
import { debugLog } from "../../config/debug.js";

class DayController {
  constructor() {
    ModelFactory.getModel()
      .then((model) => {
        this.model = model;
        debugLog(`DayController initialized.`);
      })
      .catch((err) => console.error("Error initializing model: ", err));
  }

  async getAllData(req, res) {
    try {
      const data = await this.model.read();
      if (!data || data.length === 0) {
        debugLog("No data found.");
        return res.status(404).json({ error: "No data found." });
      } else {
        debugLog("All data retrieved successfully.");
        // Ensure data is an array of plain objects
        const plainData = data.map((item) =>
          item.toJSON ? item.toJSON() : item
        );
        return res.status(200).json(plainData); // 200 - OK
      }
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async getYear(req, res) {
    // TODO: Get all data for a specific year
  }

  async getMonth(req, res) {
    // TODO: Get all data for a specific month
  }

  async getWeek(req, res) {
    // TODO: Get all data for a specific week
  }

  // Retrieve a specific day's data
  async getDay(req, res) {
    try {
      const { id } = req.params;
      debugLog(`DayController.getDay Request params: ${id}`);
      const data = await this.model.read(id);
      if (!data) {
        debugLog(`${id} not found.`);
        return res.status(404).json({ error: "No data found." });
      } else {
        debugLog(`${id} retrieved successfully.`);
        return res.status(200).json(data); // 200 - OK
      }
    } catch (err) {
      debugLog(`Error retrieving data: ${err.message}`);
      return res.status(500).json({ error: err.message });
    }
  }

  // Add a new day's data
  // Request body should contain the `day` object to add
  async addDay(req, res) {
    try {
      const day = req.body;
      if (!day || !day.date_id) {
        // debugLog("Invalid request body.");
        return res.status(400).json({ error: "Invalid request body." });
      }
      // debugLog(`DayController.addDay Request body: ${day.date_id}`);
      const data = await this.model.create(day);
      if (!data) {
        debugLog("Day already exists.");
        return res.status(400).json({ error: "Day already exists." });
      } else {
        debugLog(`${day.date_id} added successfully.`);
        return res.status(201).json(data); // 201 - Created
      }
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Remove a specific day's data
  // Request body should contain the `date_id`
  async removeDay(req, res) {
    try {
      const { date_id } = req.body;
      debugLog(`DayController.removeDay Request body: ${date_id}`);
      const data = await this.model.read(date_id);
      if (!data) {
        debugLog(`${date_id} not found.`);
        return res.status(404).json({ error: "No data found." });
      } else {
        await this.model.delete(data);
        debugLog(`${date_id} removed successfully.`);
        return res.status(200).json(data); // 200 - OK
      }
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Remove all day data
  async clearAllData(req, res) {
    try {
      await this.model.delete();
      return res.status(204); // 204 - No Content
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async getEmotions(req, res) {
    // TODO: Get all emotions for a specific day
    try {
      const { date_id } = req.body;
      debugLog(`DayController.getEmotions Request body: ${date_id}`);
      const data = await this.model.read(date_id);
      if (!data || !data.emotions) {
        debugLog(`${date_id} not found.`);
        return res.status(404).json({ error: "No data found." });
      } else {
        debugLog(`Emotions for ${date_id} retrieved successfully.`);
        return res.status(200).json(data.emotions); // 200 - OK
      }
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async getEmotion(req, res) {
    // TODO: Get a specific emotion for a specific day
  }

  async clearEmotions(req, res) {
    // TODO: Clear all emotions for a specific day
  }
  async clearEmotion(req, res) {
    // TODO: Clear a specific emotion for a specific day
  }
  async addEmotions(req, res) {
    // TODO: Add an emotions collection to a specific day
  }
  async addEmotion(req, res) {
    // TODO: Add an emotion to a specific day
  }
  async updateEmotion(req, res) {
    // TODO: Update an emotion for a specific day
  }
}

export default new DayController();
