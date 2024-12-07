import { getToday } from "../../../front-end/src/utils/dateUtils.js";
import { Day } from "../../../front-end/src/utils/Day.js";
import { Emotion } from "../../../front-end/src/utils/Emotion.js";

class _LocalDayModel {
  constructor() {
    this.dateData = [];
    this.date_id = getToday();
  }

  // Helper function to verify Day object
  isValidDay(data) {
    return (
      typeof data.date_id === "string" &&
      Array.isArray(data.emotions) &&
      typeof data.rating === "number" &&
      typeof data.journal === "string"
    );
  }

  // Helper function to verify Emotion object
  isValidEmotion(data) {
    return (
      typeof data.date_id === "string" &&
      typeof data.emotion_id === "string" &&
      typeof data.magnitude === "number" &&
      typeof data.description === "string" &&
      typeof data.timestamp === "string"
    );
  }

  // Creates a new day object and adds it to the calendar
  async create(data = null) {
    if (data === null) {
      // default to create a new day
      data = new Day();
    } else if (!this.isValidDay(data) && !this.isValidEmotion(data)) {
      throw new Error(
        "Invalid data object. Must be an instance of Day or Emotion."
      );
    }

    if (this.isValidDay(data)) {
      const existingDay = await this.read(data.date_id);
      if (!existingDay) {
        console.log(`No day found for ${data.date_id}`);
        // if day doesn't exist, add it
        this.dateData.push(data);
      } else {
        console.log(`Day already exists for ${data.date_id}`);
        console.log(`this.dateData: ${JSON.stringify(this.dateData)}`);
        // Update the existing day
        console.log(`Updating existing day to: ${JSON.stringify(data)}`);
        return await this.update(data);
      } // otherwise ignore and return the existing day
      return data;
    } else if (this.isValidEmotion(data)) {
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
    // print out the contents of the current array
    console.log(this.dateData);
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
