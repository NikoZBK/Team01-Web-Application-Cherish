/**
 * Entry point: restores the session, then shows the view named by the URL
 * hash (#/calendar/2026-11, #/day/2026-11-12, #/insights, #/account).
 */
import { ApiError, logout, refresh } from "./api/client.js";
import { isIsoDate, isMonth, monthOf, today } from "./domain/dates.js";
import { h, mount, toast } from "./ui/dom.js";
import { accountView } from "./views/account.js";
import { calendarView } from "./views/calendar.js";
import { dayView } from "./views/day.js";
import { insightsView } from "./views/insights.js";
import { loginView } from "./views/login.js";

const root = document.getElementById("app");

let user = null;

/** Picks the view for a hash; unknown or malformed addresses fall back to this month. */
function resolve(hash) {
  const [, name, argument] = hash.replace(/^#/, "").split("/");
  if (name === "day" && argument && isIsoDate(argument)) return { tab: "day", render: () => dayView(argument) };
  if (name === "day" && !argument) return { tab: "day", render: () => dayView(today()) };
  if (name === "insights") return { tab: "insights", render: () => insightsView() };
  if (name === "account") return { tab: "account", render: () => accountView({ user, onSignedOut: signOut }) };
  const month = argument && isMonth(argument) ? argument : monthOf(today());
  return { tab: "calendar", render: () => calendarView(month) };
}

const TABS = [
  { id: "calendar", label: "Calendar", href: "#/calendar" },
  { id: "day", label: "Today", href: "#/day" },
  { id: "insights", label: "Insights", href: "#/insights" },
  { id: "account", label: "Account", href: "#/account" },
];

// Counts renders, so a slow view that finishes after the user moved on is dropped.
let renderCount = 0;

async function render() {
  const turn = ++renderCount;

  if (user === null) {
    mount(root, loginView({ onSignedIn: signIn }));
    return;
  }

  const route = resolve(location.hash);
  const main = h("main", { class: "view", tabIndex: -1 }, h("p", { class: "loading" }, "Loading…"));
  mount(
    root,
    h(
      "header",
      { class: "top" },
      h("a", { class: "brand", href: "#/calendar" }, "🌱 Cherish"),
      h(
        "nav",
        { "aria-label": "Main" },
        TABS.map((tab) =>
          h("a", { href: tab.href, "aria-current": tab.id === route.tab ? "page" : null }, tab.label),
        ),
      ),
    ),
    main,
  );

  try {
    const content = await route.render();
    if (turn === renderCount) mount(main, content);
  } catch (error) {
    if (turn !== renderCount) return;
    if (error instanceof ApiError && error.status === 401) {
      signOut("Your session ended. Please sign in again.");
      return;
    }
    console.error(error);
    mount(
      main,
      h("p", { class: "error", role: "alert" }, describe(error)),
      h("button", { type: "button", onclick: render }, "Try again"),
    );
  }
}

/** A sentence a person can act on, for any failure. */
export function describe(error) {
  if (error instanceof ApiError) {
    if (error.status === 429) return "Too many requests. Wait a minute and try again.";
    if (error.status >= 500) return "The server had a problem. Please try again.";
    return error.message;
  }
  return "Cherish could not reach the server. Check that it is running and try again.";
}

function signIn(signedIn) {
  user = signedIn;
  if (!location.hash) history.replaceState(null, "", "#/calendar");
  render();
}

function signOut(message) {
  user = null;
  logout().catch(() => undefined);
  history.replaceState(null, "", location.pathname);
  render();
  if (typeof message === "string") toast(message, "error");
}

window.addEventListener("hashchange", render);

// A day that fails to save rejects out of an event handler; say so rather than fail silently.
window.addEventListener("unhandledrejection", (event) => {
  event.preventDefault();
  console.error(event.reason);
  if (event.reason instanceof ApiError && event.reason.status === 401) {
    signOut("Your session ended. Please sign in again.");
  } else {
    toast(describe(event.reason), "error");
  }
});

try {
  user = await refresh();
} catch (error) {
  console.error(error);
  toast(describe(error), "error");
}
render();
