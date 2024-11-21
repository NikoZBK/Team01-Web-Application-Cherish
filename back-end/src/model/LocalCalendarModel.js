import { getToday } from "../utils/dateUtils";
import { Day } from "../utils/Day";

class _LocalCalendarModel {
  constructor() {
    this.dateData = [];
    this.date_id = getToday();
  }

  async create(day = null) {
    if (day === null) {
      day = new Day();
    }

    console.assert(day instanceof Day, "Day should be an instance of Day.");

    if (day.date_id === this.date_id) {
      return;
    }

    this.dateData.push(day);
    return day;
  }

  async read(id = null) {
    if (id) {
      return this.dateData.find((day) => day.date_id === id);
    }
    return this.dateData;
  }

  async update(day) {
    const index = this.dateData.findIndex((d) => d.date_id === day.date_id);
    this.dateData[index] = day;
    return day;
  }
  // Deletes the specified day from the calendar
  async delete(day = null) {
    if (day === null) {
      // this.dateData = []; Potentially dangerous, may be useful if user wants to clear all data, commented out for now
      return;
    }

    const index = this.dateData.findIndex((d) => d.date_id === day.date_id);
    this.dateData.splice(index, 1);
    return day;
  }
}

const LocalCalendarModel = new _LocalCalendarModel();

export default LocalCalendarModel;
