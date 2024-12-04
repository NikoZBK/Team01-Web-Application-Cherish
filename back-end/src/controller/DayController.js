import ModelFactory from "../model/ModelFactory.js";
import { debugLog } from "../../config/debug.js";
import { factoryResponse } from "../../authentication/middleware.js";

class DayController {
  constructor() {
    ModelFactory.getModel("sqlite")
      .then((model) => {
        this.model = model;
        debugLog(`DayController initialized with model: ${typeof model}`);
      })
      .catch((err) => console.error("Error initializing model: ", err));
  }

  async getAllData(req, res) {
    try {
      const data = await this.model.read();
      if (!data) {
        debugLog("No data found.");
        return res.status(404).json({ error: "No data found." });
      } else {
        debugLog("All data retrieved successfully.");
        return res.status(200).json(data); // 200 - OK
      }
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }


  // Retrieves the user's account data
  // Request body should contain the `username`
  async getUserByUsername(req, res) {
    try {
      const { username } = req.body;
      debugLog(`DayController.getUserByUsername Request body: ${username}`);
      const data = await this.model.loginUser(username);

      if (!data) {
        debugLog(`${username} not found.`);
        return res.status(404).json(factoryResponse(404, `Account not found`));
      }

      debugLog(`Account data retrieved successfully.`);
      return res.status(200).json(data);
    }
    catch (error) {
      debugLog(`Error retrieving data: ${err.message}`);
      return res.status(500).json(factoryResponse(500, error.message));
    }
  }

  // Creates a new account ()
  async registerAccount(req, res) {
    try {
      
    }
    catch (error) {
      debugLog(`Error registering account: ${error.message}`);
      return res.status(500).json(factoryResponse(500, error.message));
    }
  }

  // Gets all the data within a specified year
  // Request body contains the year id
  async getYear(req, res) {
    // TODO: Get all data for a specific year
    try {
      const { year } = req.body
      debugLog(`DayController.getYear Request body: ${year}`);

      const data = await this.model.readYear(year);
      if (!data) {
        debugLog(`No data found in year ${year}`);
        return res.status(404).json(factoryResponse(404, `No data found in year ${year}`));
      }
      debugLog(`Data within year ${year} retrieved successfully.`);
      return res.status(200).json(data); // 200 - OK

    } catch (error) {
      debugLog(`Error retrieving year data: ${error.message}`);
      return res.status(500).json(factoryResponse(500, error.message));
    }
  }

   // Gets all the data within a specified month
  // Request body contains the month id
  async getMonth(req, res) {
    // TODO: Get all data for a specific month
    try {
      const { month } = req.body
      debugLog(`DayController.getMonth Request body: ${month}`);

      const data = await this.model.readMonth(month);
      if (!data) {
        debugLog(`No data found in month ${month}`);
        return res.status(404).json(factoryResponse(404, `No data found in month ${year}`));
      }
      debugLog(`Data within month ${year} retrieved successfully.`);
      return res.status(200).json(data); // 200 - OK

    } catch (error) {
      debugLog(`Error retrieving month data: ${error.message}`);
      return res.status(500).json(factoryResponse(500, error.message));
    }
  }

  async getWeek(req, res) {
    // TODO: Get all data for a specific week
    
  }

  // Retrieve a specific day's data
  // Request body should contain the `date_id`
  async getDay(req, res) {
    try {
      const { date_id } = req.body;
      debugLog(`DayController.getDay Request body: ${date_id}`);
      const data = await this.model.read(date_id);
      if (!data) {
        debugLog(`${date_id} not found.`);
        return res.status(404).json({ error: "No data found." });
      } else {
        debugLog(`${date_id} retrieved successfully.`);
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
      debugLog(`DayController.addDay Request body: ${day.date_id}`);
      const data = await this.model.create(day); // returns a sequelize table object
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
  async clearDateData(req, res) {
    try {
      await this.model.delete();
      return res.status(204); // 204 - No Content
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getEmotions(req, res) {
    // TODO: Get all emotions for a specific day
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

export default DayController;
