import { getToday } from "../utils/dateUtils";
import { Day } from "../utils/Day";

class _LocalDayModel {
  constructor() {
    this.dateData = [];
    this.date_id = getToday();
  }
  // Creates a new day object and adds it to the calendar
  // TODO: Make compatible with an emotion
  async create(day = null) {
    if (day === null) {
      day = new Day();
    }

    if (!(day instanceof Day)) {
      throw new Error("Invalid day object. Must be an instance of Day.");
    }

    if (this.dateData.some((d) => d.date_id === day.date_id)) {
      return;
    }

    this.dateData.push(day);
    return day;
  }
  // Returns the specified day object from the calendar
  async read(id = null) {
    if (id) {
      return this.dateData.find((day) => day.date_id === id);
    }
    return this.dateData;
  }

  // Updates the specified day in the calendar
  async update(day) {
    const index = this.dateData.findIndex((d) => d.date_id === day.date_id);
    this.dateData[index] = day;
    return day;
  }

  // Deletes the specified day from the calendar
  async delete(day = null) {
    if (day === null) {
      this.dateData = [];
      return;
    }

    const index = this.dateData.findIndex((d) => d.date_id === day.date_id);
    this.dateData.splice(index, 1);
    return day;
  }
}

const LocalCalendarModel = new _LocalDayModel();

export default LocalCalendarModel;
