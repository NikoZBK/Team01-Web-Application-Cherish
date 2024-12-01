import DayController from "../controller/DayController.js";
import ModelFactory from "../model/ModelFactory.js";
import { debugLog } from "../../config/debug.js";

describe("DayController", () => {
  let dayController;
  let mockModel;

  beforeAll(async () => {
    mockModel = {
      read: jasmine.createSpy("read"),
      create: jasmine.createSpy("create"),
      delete: jasmine.createSpy("delete"),
      update: jasmine.createSpy("update"),
    };
    spyOn(ModelFactory, "getModel").and.returnValue(Promise.resolve(mockModel));
    dayController = new DayController();
    await dayController.model;
  });

  describe("getAllData", () => {
    it("should return all date data", async () => {
      const req = {};
      const res = {
        json: jasmine.createSpy("json"),
        status: jasmine
          .createSpy("status")
          .and.returnValue({ json: jasmine.createSpy("json") }),
      };
      const dateData = [{ date_id: "1", emotions: [] }];
      mockModel.read.and.returnValue(Promise.resolve(dateData));

      await dayController.getAllData(req, res);

      expect(mockModel.read).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(dateData);
    });

    it("should return 404 if no data found", async () => {
      const req = {};
      const res = {
        json: jasmine.createSpy("json"),
        status: jasmine
          .createSpy("status")
          .and.returnValue({ json: jasmine.createSpy("json") }),
      };
      mockModel.read.and.returnValue(Promise.resolve(null));

      await dayController.getAllData(req, res);

      expect(mockModel.read).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.status().json).toHaveBeenCalledWith({
        error: "No data found.",
      });
    });
  });

  describe("getDay", () => {
    it("should return specific day", async () => {
      const req = { body: { date_id: "1" } };
      const res = {
        json: jasmine.createSpy("json"),
        status: jasmine.createSpy("status").and.returnValue({
          json: jasmine.createSpy("json"),
        }),
      };
      const dateData = { date_id: "1", emotions: [] };
      mockModel.read.and.returnValue(Promise.resolve(dateData));

      await dayController.getDay(req, res);

      expect(mockModel.read).toHaveBeenCalledWith("1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.status().json).toHaveBeenCalledWith(dateData);
    });

    it("should return 404 if no data found", async () => {
      const req = { body: { date_id: "1" } };
      const res = {
        json: jasmine.createSpy("json"),
        status: jasmine.createSpy("status").and.returnValue({
          json: jasmine.createSpy("json"),
        }),
      };
      mockModel.read.and.returnValue(Promise.resolve(null));

      await dayController.getDay(req, res);

      expect(mockModel.read).toHaveBeenCalledWith("1");
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.status().json).toHaveBeenCalledWith({
        error: "No data found.",
      });
    });
  });
  describe("addDay", () => {
    it("should add a new day", async () => {
      const req = { body: { date_id: "1", emotions: [] } };
      const res = {
        json: jasmine.createSpy("json"),
        status: jasmine
          .createSpy("status")
          .and.returnValue({ json: jasmine.createSpy("json") }),
      };
      mockModel.create.and.returnValue(Promise.resolve(req.body));

      await dayController.addDay(req, res);

      expect(mockModel.create).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.status().json).toHaveBeenCalledWith(req.body);
    });

    it("should return 400 if day already exists", async () => {
      const req = { body: { date_id: "1", emotions: [] } };
      const res = {
        json: jasmine.createSpy("json"),
        status: jasmine
          .createSpy("status")
          .and.returnValue({ json: jasmine.createSpy("json") }),
      };
      mockModel.create.and.returnValue(Promise.resolve(null));

      await dayController.addDay(req, res);

      expect(mockModel.create).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.status().json).toHaveBeenCalledWith({
        error: "Day already exists.",
      });
    });
  });
  describe("removeDay", () => {
    it("should remove a specific day", async () => {
      const req = { body: { date_id: "1" } };
      const res = {
        json: jasmine.createSpy("json"),
        status: jasmine
          .createSpy("status")
          .and.returnValue({ json: jasmine.createSpy("json") }),
      };
      const dateData = { date_id: "1", emotions: [] };
      mockModel.read.and.returnValue(Promise.resolve(dateData));

      await dayController.removeDay(req, res);

      expect(mockModel.read).toHaveBeenCalledWith("1");
      expect(mockModel.delete).toHaveBeenCalledWith(dateData);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.status().json).toHaveBeenCalledWith(dateData);
    });
  });
});
