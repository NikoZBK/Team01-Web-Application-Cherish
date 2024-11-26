import express from "express";
import DayController from "../controller/DayController.js";

class DayRoutes {
  constructor() {
    this.router = express.Router();
    this.initializeRoutes();
  }

  initializeRoutes() {
    // Define the routes and connect them to controller methods

    // DESCRIPTION
    //   Get all days. This endpoint returns an object with a 'days' property
    //   containing an array of days.
    // REQUEST
    //   GET /days
    // RESPONSE
    //   {
    //     "days": [ ... ]
    //   }
    // STATUS CODES
    //   200 - OK: The request was successful
    //   500 - Internal Server Error: The server encountered an error
    this.router.get("/days", async (req, res) => {
      await DayController.getAllDateData(req, res);
    });

    // DESCRIPTION
    //   Add a new Day. This endpoint creates a new Day with the provided
    //   date_id and returns the created day.
    // REQUEST
    //   POST /day
    //   {
    //     "date_id": "MM-DD-YY"
    //     "emotions": [ ... ],
    //     "rating": 5,
    //     "journal": ""
    //   }
    // RESPONSE
    //   {
    //      "date_id": 11-26-24,
    //      "emotions": [],
    //      "rating": 5,
    //      "journal": ""
    //   }
    // STATUS CODES
    //   200 - OK: The task was created successfully
    //   400 - Bad Request: The request was invalid or missing required data
    //   500 - Internal Server Error: The server encountered an error
    this.router.post("/days", async (req, res) => {
      await DayController.create(req, res);
    });

    // DESCRIPTION
    //   Clear all days. This endpoint deletes all days and returns an empty
    //   response. This operation cannot be undone.
    // REQUEST
    //   DELETE /days
    // RESPONSE
    //   { }
    // STATUS CODES
    //   200 - OK: The tasks were cleared successfully
    //   500 - Internal Server Error: The server encountered an error
    this.router.delete("/days", async (req, res) => {
      await DayController.clearDateData(req, res);
    });
  }

  getRouter() {
    return this.router;
  }
}

export default new DayRoutes().getRouter();
