import { getToday } from "../utils/dateUtils";

class _LocalCalendarModel {
  constructor() {
    this.dateData = [];
    this.date_id = getToday();
  }

  async create(day = null) {
    if (day === null) {
      day = {
        date_id: this.date_id,
        journal: "",
        check_in: "",
        events: [],
      };
    } else if (day.date_id === undefined) {
      day.date_id = this.date_id;
    } else if (day.date_id === this.date_id) {
      return;
    }
    day.date_id = this.date_id;
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
