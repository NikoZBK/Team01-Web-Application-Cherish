import { getToday } from "./dateUtils";

class Day {
  constructor(date_id = getToday(), emotions = [], rating = 0, journal = "") {
    this.date_id = date_id;
    this.emotions = emotions;
    this.rating = rating;
    this.journal = journal;
  }

  setDateId(date_id) {
    const datePattern = /^\d{2}-\d{2}-\d{4}$/;
    if (!datePattern.test(date_id)) {
      throw new Error("Invalid date format. Please use MM-DD-YYYY.");
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
    if (isNaN(rating) || rating < 1 || rating > 10) {
      throw new Error("Rating must be between 1 and 10.");
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
}

export { Day };
