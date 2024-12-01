import { CalendarComponent } from "./pages/calendar/CalendarComponent.js";
import { DayComponent } from "./pages/day/DayComponent.js";
import { JournalComponent } from "./pages/journal/JournalComponent.js";
import { CheckInComponent } from "./pages/check-in/CheckInComponent.js";
import { SummaryComponent } from "./pages/summary/SummaryComponent.js";
import { EventHub } from "./eventhub/EventHub.js";
import { Events } from "./eventhub/Events.js";
import { getToday } from "./utils/dateUtils.js";
import IDBCherishRepoService from "./services/IDBCherishRepoService.js";
import { Day } from "./utils/Day.js";

const hub = EventHub.getInstance();

// Initializes database then loads in Main Page
hub.subscribe(Events.InitDataSuccess, async () => {
  console.log("Initialized database successfully");

  // Restore the current day's data if there is any
  let today = await DATABASE.restoreDay(id);
  if (!today) {
    console.log("No data found for today, creating new day object");
    today = new Day();
  }
  hub.publish(Events.LoadMainPage, today);
  hub.publish(Events.LoadNav, today);
});

hub.subscribe(Events.InitDataFailed, () =>
  console.log("Failed to initialize database")
);

const id = getToday();

export const DATABASE = new IDBCherishRepoService();
const calendar = new CalendarComponent(new Date());
const day = new DayComponent();
const journal = new JournalComponent();
const checkIn = new CheckInComponent();
const summary = new SummaryComponent();

// Retrieves data for the current day, on success passes data through an event

console.log("Everything loaded");

// hub.subscribe(Events.ClearedDataSuccess, () => console.log("Data cleared"));
// hub.subscribe(Events.ClearedDataFailed, () => console.log("Failed to clear data"));
// DATABASE.clearDatabase().then()
