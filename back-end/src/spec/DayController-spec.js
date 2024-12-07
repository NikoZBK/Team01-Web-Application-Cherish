import DayController from "../controller/DayController.js";
import ModelFactory from "../model/ModelFactory.js";
import { createMockRequestResponse } from "../spec/helpers/mockRequestResponse.js";

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
      const { req, res } = createMockRequestResponse();
      const dateData = [{ date_id: "1", emotions: [] }];
      mockModel.read.and.returnValue(Promise.resolve(dateData));

      await dayController.getAllData(req, res);

      expect(mockModel.read).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.status().json).toHaveBeenCalledWith(dateData);
    });

    it("should return 404 if no data found", async () => {
      const { req, res } = createMockRequestResponse();
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
      const { req, res } = createMockRequestResponse({ date_id: "1" });
      const dateData = { date_id: "1", emotions: [] };
      mockModel.read.and.returnValue(Promise.resolve(dateData));

      await dayController.getDay(req, res);

      expect(mockModel.read).toHaveBeenCalledWith("1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.status().json).toHaveBeenCalledWith(dateData);
    });

    it("should return 404 if no data found", async () => {
      const { req, res } = createMockRequestResponse({ date_id: "1" });
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
      const { req, res } = createMockRequestResponse({
        date_id: "1",
        emotions: [],
      });
      mockModel.create.and.returnValue(Promise.resolve(req.body));

      await dayController.addDay(req, res);

      expect(mockModel.create).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.status().json).toHaveBeenCalledWith(req.body);
    });

    it("should return 400 if day already exists", async () => {
      const { req, res } = createMockRequestResponse({
        date_id: "1",
        emotions: [],
      });
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
      const { req, res } = createMockRequestResponse({ date_id: "1" });
      const dateData = { date_id: "1", emotions: [] };
      mockModel.read.and.returnValue(Promise.resolve(dateData));

      await dayController.removeDay(req, res);

      expect(mockModel.read).toHaveBeenCalledWith("1");
      expect(mockModel.delete).toHaveBeenCalledWith(dateData);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.status().json).toHaveBeenCalledWith(dateData);
    });
    it("should return 404 if no data found", async () => {
      const { req, res } = createMockRequestResponse({ date_id: "1" });
      mockModel.read.and.returnValue(Promise.resolve(null));

      await dayController.removeDay(req, res);

      expect(mockModel.read).toHaveBeenCalledWith("1");
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.status().json).toHaveBeenCalledWith({
        error: "No data found.",
      });
    });
  });
  describe("clearAllData", () => {
    it("should remove all logged data", async () => {
      const { req, res } = createMockRequestResponse();
      mockModel.delete.and.returnValue(Promise.resolve());

      await dayController.clearAllData(req, res);

      expect(mockModel.delete).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(204);
    });
  });
  describe("getEmotions", () => {
    it("should return all emotions for a specific day", async () => {
      const { req, res } = createMockRequestResponse({ date_id: "1" });
      const dateData = { date_id: "1", emotions: [{ emotion_id: "Happy" }] };
      mockModel.read.and.returnValue(Promise.resolve(dateData));

      const result = await dayController.getEmotions(req, res);
      // print out the result for debugging
      console.info(`Jasmine: ${result}`);

      expect(mockModel.read).toHaveBeenCalledWith("1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.status().json).toHaveBeenCalledWith(dateData.emotions);
    });

    it("should return 404 if no data found", async () => {
      const { req, res } = createMockRequestResponse({ date_id: "1" });
      mockModel.read.and.returnValue(Promise.resolve(null));

      await dayController.getEmotions(req, res);

      expect(mockModel.read).toHaveBeenCalledWith("1");
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.status().json).toHaveBeenCalledWith({
        error: "No data found.",
      });
    });
  });
});
