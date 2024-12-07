import express from "express";
import DayController from "../controller/DayController.js";
import { debugLog } from "../../config/debug.js";

class DayRoutes {
  constructor() {
    this.router = express.Router();
    this.initializeRoutes();
  }

  initializeRoutes() {
    // Define the routes and connect them to controller methods

    // Get all days
    this.router.get("/days", async (req, res) => {
      debugLog(`GET /days`);
      await DayController.getAllData(req, res);
    });

    // Get a specific day
    this.router.get("/days/:id", async (req, res) => {
      debugLog(`GET /days/${req.params.id}`);
      await DayController.getDay(req, res);
    });

    // Add a new day
    this.router.post("/days/:id", async (req, res) => {
      debugLog(`POST /days/${req.params.id}`);
      await DayController.addDay(req, res);
    });

    // Clear all days
    this.router.delete("/days", async (req, res) => {
      debugLog(`DELETE /days`);
      await DayController.clearAllData(req, res);
    });
  }

  getRouter() {
    return this.router;
  }
}

export default new DayRoutes().getRouter();
