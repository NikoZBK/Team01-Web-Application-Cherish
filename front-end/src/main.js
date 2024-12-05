import { CalendarComponent } from "./pages/calendar/CalendarComponent.js";
import { DayComponent } from "./pages/day/DayComponent.js";
import { JournalComponent } from "./pages/journal/JournalComponent.js";
import { CheckInComponent } from "./pages/check-in/CheckInComponent.js";
import { SummaryComponent } from "./pages/summary/SummaryComponent.js";
import { EventHub } from "./eventhub/EventHub.js";
import { Events } from "./eventhub/Events.js";
import { getToday } from "./utils/dateUtils.js";
import { LoginPage } from "./pages/LoginPage.js"; 
// import IDBCherishRepoService from "./services/IDBCherishRepoService.js";
import RemoteCherishRepoService from "./services/RemoteCherishRepoService.js";
import { Day } from "./utils/Day.js";

const hub = EventHub.getInstance();

// Initializes database then loads in Main Page
hub.subscribe(Events.InitDataSuccess, async () => {
  console.log("Initialized database successfully");
  const id = getToday();
  // Restore the current day's data if there is any
  let today = await DATABASE.storeDay(new Day(id));

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
const loadLoginPage = () => {
  console.log("Loading Login Page");
  new LoginPage(); // Render the login page
};

// Use EventHub to load the login page or other components dynamically
hub.subscribe(Events.LoadLoginPage, loadLoginPage);

// Check if the user is logged in, else load the login page
const isAuthenticated = false; // Placeholder for actual auth check logic
if (!isAuthenticated) {
  hub.publish(Events.LoadLoginPage);
} else {
  console.log("User authenticated, loading application...");
  hub.publish(Events.InitDataSuccess);
}

console.log("Everything loaded");

// hub.subscribe(Events.ClearedDataSuccess, () => console.log("Data cleared"));
// hub.subscribe(Events.ClearedDataFailed, () => console.log("Failed to clear data"));
// DATABASE.clearDatabase().then()
