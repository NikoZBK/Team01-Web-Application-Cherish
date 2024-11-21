import { getToday } from "./dateUtils";

class Day {
  constructor(date_id = getToday(), emotions = [], rating = 0, journal = "") {
    this.date_id = date_id;
    this.emotions = emotions;
    this.rating = rating;
    this.journal = journal;
  }
}

export { Day };
