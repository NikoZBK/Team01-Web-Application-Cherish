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

    // DESCRIPTION
    //   Get all days. This endpoint returns an object with a 'calendar' property
    //   containing an array of days.
    // REQUEST
    //   GET /v1/calendar
    // RESPONSE
    //   {
    //     "calendar": [ ... ]
    //   }
    // STATUS CODES
    //   200 - OK: The request was successful
    //   500 - Internal Server Error: The server encountered an error
    this.router.get("/v1/calendar", async (req, res) => {
      debugLog("GET /v1/calendar");
      await DayController.getAllDateData(req, res);
    });

    // DESCRIPTION
    //   Add a new Day. This endpoint creates a new Day with the provided
    //   date_id and returns the created day.
    // REQUEST
    //   POST /calendar/days
    //   {
    //     "date_id": "11-26-24"
    //     "emotions": [],
    //     "rating": 5,
    //     "journal": ""
    //   }
    // RESPONSE
    //   {
    //      "date_id": "11-26-24",
    //      "emotions": [],
    //      "rating": 5,
    //      "journal": ""
    //   }
    // STATUS CODES
    //   200 - OK: The day was created and stored successfully
    //   400 - Bad Request: The request was invalid or missing required data
    //   500 - Internal Server Error: The server encountered an error
    this.router.post("/v1/calendar/days", async (req, res) => {
      debugLog("POST /v1/calendar/days");
      await DayController.create(req, res);
    });

    // DESCRIPTION
    //   Clear all days/the calendar. This endpoint deletes all days and returns an empty
    //   response. This operation cannot be undone.
    // REQUEST
    //   DELETE /calendar
    // RESPONSE
    //   { }
    // STATUS CODES
    //   200 - OK: The tasks were cleared successfully
    //   500 - Internal Server Error: The server encountered an error
    this.router.delete("/v1/calendar", async (req, res) => {
      debugLog("DELETE /v1/calendar");
      await DayController.clearDateData(req, res);
    });
  }

  getRouter() {
    return this.router;
  }
}

export default new DayRoutes().getRouter();
