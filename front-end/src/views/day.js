import { getDay, saveDay } from "../api/days.js";
import { addDays, formatLong, monthOf, timeOf, today } from "../domain/dates.js";
import {
  EMOTIONS,
  MAX_DESCRIPTION,
  MAX_JOURNAL,
  MAX_MAGNITUDE,
  MIN_MAGNITUDE,
  emojiOf,
  rateDay,
  ratingColor,
} from "../domain/emotions.js";
import { h, mount, toast } from "../ui/dom.js";

// Warn before closing the page with journal text that was never saved.
let hasUnsavedJournal = () => false;
window.addEventListener("beforeunload", (event) => {
  if (hasUnsavedJournal()) event.preventDefault();
});

/** One day: its check-ins, a form to add one, and its journal. */
export async function dayView(date) {
  const todayIso = today();
  const header = h(
    "div",
    { class: "toolbar" },
    h("a", { class: "button", href: `#/day/${addDays(date, -1)}`, "aria-label": "Previous day" }, "‹"),
    h("h1", null, date === todayIso ? "Today" : formatLong(date)),
    date < todayIso
      ? h("a", { class: "button", href: `#/day/${addDays(date, 1)}`, "aria-label": "Next day" }, "›")
      : h("span", { class: "button disabled", "aria-hidden": "true" }, "›"),
  );
  const back = h("a", { href: `#/calendar/${monthOf(date)}` }, "← Calendar");

  if (date > todayIso) {
    return [header, h("p", { class: "muted" }, "This day has not happened yet."), back];
  }

  let day = await getDay(date);

  const ratingBox = h("p", { class: "rating" });
  const list = h("ul", { class: "checkins" });

  /** Stores the day with `changes` applied, then shows what the server kept. */
  async function update(changes) {
    const next = { ...day, ...changes };
    next.rating = rateDay(next.emotions);
    day = await saveDay(next);
    renderCheckIns();
  }

  function renderCheckIns() {
    mount(
      ratingBox,
      day.rating > 0
        ? [
            h("strong", { style: `color: ${ratingColor(day.rating)}` }, day.rating.toFixed(1)),
            " / 10 — rated from your check-ins",
          ]
        : "Not rated yet. Add a check-in to rate the day.",
    );
    mount(
      list,
      day.emotions.length === 0
        ? h("li", { class: "muted" }, "No check-ins yet.")
        : day.emotions.map((entry, index) =>
            h(
              "li",
              null,
              h("span", { class: "emoji", "aria-hidden": "true" }, emojiOf(entry.emotion)),
              h(
                "div",
                { class: "grow" },
                h("strong", null, `${entry.emotion} · ${entry.magnitude}/10`),
                h("span", { class: "muted" }, ` ${entry.time}`),
                entry.description ? h("p", null, entry.description) : null,
              ),
              h(
                "button",
                {
                  class: "link",
                  type: "button",
                  "aria-label": `Remove the ${entry.emotion} check-in from ${entry.time}`,
                  onclick: async () => {
                    await update({ emotions: day.emotions.filter((_, position) => position !== index) });
                    toast("Check-in removed");
                  },
                },
                "Remove",
              ),
            ),
          ),
    );
  }

  // --- Add a check-in ---
  const magnitude = h("input", {
    id: "magnitude",
    type: "range",
    min: MIN_MAGNITUDE,
    max: MAX_MAGNITUDE,
    step: 1,
    value: 5,
    oninput: () => (magnitudeValue.textContent = magnitude.value),
  });
  const magnitudeValue = h("output", { for: "magnitude" }, "5");
  const description = h("input", {
    id: "description",
    type: "text",
    maxLength: MAX_DESCRIPTION,
    placeholder: "What is behind it? (optional)",
  });
  const addButton = h("button", { class: "primary", type: "submit" }, "Add check-in");

  const checkInForm = h(
    "form",
    {
      class: "card",
      onsubmit: async (event) => {
        event.preventDefault();
        const emotion = new FormData(checkInForm).get("emotion");
        addButton.disabled = true;
        try {
          await update({
            emotions: [
              ...day.emotions,
              {
                emotion,
                magnitude: Number(magnitude.value),
                description: description.value.trim(),
                time: timeOf(new Date()),
              },
            ],
          });
          description.value = "";
          toast("Check-in added");
        } finally {
          addButton.disabled = false;
        }
      },
    },
    h("h2", null, "How do you feel?"),
    h(
      "fieldset",
      { class: "emotions" },
      h("legend", { class: "visually-hidden" }, "Emotion"),
      EMOTIONS.map((emotion, index) =>
        h(
          "label",
          null,
          h("input", { type: "radio", name: "emotion", value: emotion.id, checked: index === 0, required: true }),
          h("span", { class: "emoji", "aria-hidden": "true" }, emotion.emoji),
          h("span", null, emotion.id),
        ),
      ),
    ),
    h("div", { class: "field" }, h("label", { for: "magnitude" }, "How strongly? ", magnitudeValue, " / 10"), magnitude),
    h("div", { class: "field" }, h("label", { for: "description" }, "Note"), description),
    addButton,
  );

  // --- Journal ---
  const counter = h("span", { class: "muted" });
  const saveJournal = h("button", { class: "primary", type: "submit", disabled: true }, "Save journal");
  const journal = h("textarea", {
    id: "journal",
    rows: 8,
    maxLength: MAX_JOURNAL,
    value: day.journal,
    placeholder: "Write about your day…",
    oninput: () => refreshJournal(),
  });

  function refreshJournal() {
    counter.textContent = `${journal.value.length} / ${MAX_JOURNAL}`;
    saveJournal.disabled = journal.value === day.journal;
  }
  refreshJournal();

  const journalForm = h(
    "form",
    {
      class: "card",
      onsubmit: async (event) => {
        event.preventDefault();
        saveJournal.disabled = true;
        try {
          await update({ journal: journal.value });
          toast("Journal saved");
        } finally {
          refreshJournal();
        }
      },
    },
    h("h2", null, h("label", { for: "journal" }, "Journal")),
    journal,
    h("div", { class: "row" }, counter, saveJournal),
  );

  hasUnsavedJournal = () => journal.isConnected && journal.value !== day.journal;

  renderCheckIns();
  return [header, ratingBox, h("section", { class: "card" }, h("h2", null, "Check-ins"), list), checkInForm, journalForm, back];
}
