import { getToday } from "../../../front-end/src/utils/dateUtils.js";
import { Day } from "../../../front-end/src/utils/Day.js";
import { Emotion } from "../../../front-end/src/utils/Emotion.js";

class _LocalDayModel {
  constructor() {
    this.dateData = [];
    this.date_id = getToday();
  }
  // Creates a new day object and adds it to the calendar
  async create(data = null) {
    if (data === null) {
      // default to create a new day
      data = new Day();
    } else if (!(data instanceof Day) && !(data instanceof Emotion)) {
      throw new Error(
        "Invalid data object. Must be an instance of Day or Emotion."
      );
    }

    if (data instanceof Day) {
      if (this.read(data.date_id)) {
        return;
      } else {
        this.dateData.push(data);
        return data;
      }
    } else if (data instanceof Emotion) {
      const day = this.dateData.find((d) => d.date_id === data.date_id); // grab that emotion's day
      if (!day) {
        // Don't add the emotion if the day doesn't exist
        return;
      }
      day["emotions"].push(data);
      return data;
    }
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

const LocalDayModel = new _LocalDayModel();

export default LocalDayModel;
