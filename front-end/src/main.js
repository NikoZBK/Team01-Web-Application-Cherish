import { CalendarComponent } from "./pages/calendar/CalendarComponent.js";
import { DayComponent } from "./pages/day/DayComponent.js";
import { JournalComponent } from "./pages/journal/JournalComponent.js";
import { CheckInComponent } from "./pages/check-in/CheckInComponent.js";
import { SummaryComponent } from "./pages/summary/SummaryComponent.js";
import { EventHub } from "./eventhub/EventHub.js";
import { Events } from "./eventhub/Events.js";
import { getToday } from "./utils/dateUtils.js";
// import IDBCherishRepoService from "./services/IDBCherishRepoService.js";
import RemoteCherishRepoService from "./services/RemoteCherishRepoService.js";
import { Day } from "./utils/Day.js";

const hub = EventHub.getInstance();

// Initializes database then loads in Main Page
hub.subscribe(Events.InitDataSuccess, async () => {
  // Restore the current day's data if there is any
  const data = await DATABASE.getCachedData();
  let today = data.find((d) => d.date_id === getToday());
  if (!today) {
    console.log("No data found for today, creating new day object");
    today = new Day();
  } else {
    console.log("Loaded:", today);
  }
  hub.publish(Events.LoadMainPage, today);
  hub.publish(Events.LoadNav, today);
});

hub.subscribe(Events.InitDataFailed, () =>
  console.log("Failed to initialize database")
);

export const DATABASE = new RemoteCherishRepoService();
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
