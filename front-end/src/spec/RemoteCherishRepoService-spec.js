import { RemoteCherishRepoService } from "../services/RemoteCherishRepoService.js";
import { Events } from "../eventhub/Events.js";

describe("RemoteCherishRepoService", () => {
  let service;
  let fetchMock;

  beforeEach(() => {
    service = new RemoteCherishRepoService();
    fetchMock = spyOn(global, "fetch");
    spyOn(service, "update"); // Spy on the update method
  });

  it("should initialize the calendar", async () => {
    const mockData = { days: [] };
    fetchMock.and.returnValue(
      Promise.resolve({
        json: () => Promise.resolve(mockData),
      })
    );

    await service._initCalendar();

    expect(fetchMock).toHaveBeenCalledWith("/v1/calendar");
    expect(service.update).toHaveBeenCalledWith(
      Events.InitDataSuccess,
      mockData
    );
  });

  it("should handle calendar initialization failure", async () => {
    const mockError = new Error("Network error");
    fetchMock.and.returnValue(Promise.reject(mockError));

    try {
      await service._initCalendar();
    } catch (err) {
      expect(err.message).toBe("Failed to fetch calendar: " + mockError);
      expect(service.update).toHaveBeenCalledWith(
        Events.InitDataFailed,
        mockError
      );
    }
  });

  it("should store a day", async () => {
    const mockData = { date: "10-10-2024" };
    fetchMock.and.returnValue(
      Promise.resolve({
        json: () => Promise.resolve(mockData),
      })
    );

    const result = await service.storeDay(mockData);

    expect(fetchMock).toHaveBeenCalledWith("/v1/calendar/days", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mockData),
    });
    expect(service.update).toHaveBeenCalledWith(Events.StoredDataSuccess);
    expect(result).toEqual(mockData);
  });

  it("should handle store day failure", async () => {
    const mockError = new Error("Network error");
    fetchMock.and.returnValue(Promise.reject(mockError));

    try {
      await service.storeDay({ date: "10-10-2024" });
    } catch (err) {
      expect(err.message).toBe("Failed to store day: " + mockError);
      expect(service.update).toHaveBeenCalledWith(
        Events.StoredDataFailed,
        mockError
      );
    }
  });

  it("should restore a day", async () => {
    const mockData = { date: "10-10-2024" };
    fetchMock.and.returnValue(
      Promise.resolve({
        json: () => Promise.resolve(mockData),
      })
    );
    try {
      const result = await service.restoreDay("10-10-2024");
      expect(fetchMock).toHaveBeenCalledWith("/v1/calendar/days/10-10-2024");
      expect(service.update).toHaveBeenCalledWith(
        Events.RestoredDataSuccess,
        mockData
      );
      expect(result).toEqual(mockData);
    } catch (err) {
      fail("Should not have thrown an error");
    }
  });

  it("should remove a day", async () => {
    const mockData = { success: true };
    fetchMock.and.returnValue(
      Promise.resolve({
        json: () => Promise.resolve(mockData),
      })
    );

    const result = await service.removeDay("10-10-2024");

    expect(fetchMock).toHaveBeenCalledWith("/v1/calendar/days/10-10-2024", {
      method: "DELETE",
    });
    expect(service.update).toHaveBeenCalledWith(Events.RemovedDataSuccess);
    expect(result).toEqual(mockData);
  });

  it("should handle remove day failure", async () => {
    const mockError = new Error("Network error");
    fetchMock.and.returnValue(Promise.reject(mockError));

    try {
      await service.removeDay("10-10-2024");
    } catch (err) {
      expect(err.message).toBe("Failed to remove day: " + mockError);
      expect(service.update).toHaveBeenCalledWith(
        Events.RemovedDataFailed,
        mockError
      );
    }
  });

  it("should clear the calendar", async () => {
    const mockData = { success: true };
    fetchMock.and.returnValue(
      Promise.resolve({
        json: () => Promise.resolve(mockData),
      })
    );

    const result = await service.clearCalendar();

    expect(fetchMock).toHaveBeenCalledWith("/v1/calendar", {
      method: "DELETE",
    });
    expect(service.update).toHaveBeenCalledWith(Events.ClearedDataSuccess);
    expect(result).toEqual(mockData);
  });

  it("should handle clear calendar failure", async () => {
    const mockError = new Error("Network error");
    fetchMock.and.returnValue(Promise.reject(mockError));

    try {
      await service.clearCalendar();
    } catch (err) {
      expect(err.message).toBe("Failed to clear calendar: " + mockError);
      expect(service.update).toHaveBeenCalledWith(
        Events.ClearedDataFailed,
        mockError
      );
    }
  });
});
