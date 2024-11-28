import { getToday } from "./dateUtils.js";
import { Emotion } from "./Emotion.js";

class Day {
  #date_id;
  #emotions;
  #rating;
  #journal;

  constructor(date_id = getToday(), emotions = [], rating = 0, journal = "") {
    this.setDateId(date_id);
    this.setEmotions(emotions);
    this.setRating(rating);
    this.setJournal(journal);
  }

  setDateId(date_id) {
    const datePattern = /^\d{2}-\d?\d-\d{4}$/;
    if (!datePattern.test(date_id)) {
      throw new Error("Invalid date format. Please use MM-(D)D-YYYY.");
    }
    this.date_id = date_id;
  }

  setEmotions(emotions) {
    if (
      !Array.isArray(emotions) ||
      !emotions.every((emotion) => emotion instanceof Emotion)
    ) {
      throw new Error("All elements in emotions must be instances of Emotion.");
    }
    this.emotions = emotions;
  }

  setRating(rating) {
    if (isNaN(rating) || rating < 0 || rating > 10) {
      throw new Error("Rating must be between 0 and 10.");
    }
    this.rating = rating;
  }

  setJournal(journal) {
    if (typeof journal !== "string") {
      throw new Error("Journal must be a string.");
    }
    if (journal.length > 2000) {
      throw new Error("Journal must be at most 2000 characters.");
    }

    this.journal = journal;
  }
  getDateId() {
    return this.date_id;
  }

  getEmotions() {
    return this.emotions;
  }

  getRating() {
    return this.rating;
  }

  getJournal() {
    return this.journal;
  }
}

export { Day };
