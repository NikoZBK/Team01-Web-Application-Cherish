import { clearDays, listDays } from "../api/days.js";
import { today } from "../domain/dates.js";
import { toCsv } from "../domain/csv.js";
import { h, toast } from "../ui/dom.js";

function download(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  h("a", { href: url, download: filename }).click();
  URL.revokeObjectURL(url);
}

/** Who is signed in, plus exporting or erasing their data and signing out. */
export function accountView({ user, onSignedOut }) {
  const exportData = async () => {
    const days = await listDays();
    download(`cherish-${today()}.csv`, toCsv(days));
    toast("Export downloaded");
  };

  const eraseData = async () => {
    if (!confirm("Erase every check-in and journal entry? This cannot be undone.")) return;
    await clearDays();
    toast("All your entries were erased");
  };

  return [
    h("h1", null, "Account"),
    h("section", { class: "card" }, h("h2", null, user.displayName), h("p", { class: "muted" }, user.email)),
    h(
      "section",
      { class: "card" },
      h("h2", null, "Your data"),
      h("p", { class: "muted" }, "Download everything you have recorded as a spreadsheet file."),
      h("button", { type: "button", onclick: exportData }, "Export as CSV"),
      h("p", { class: "muted" }, "Erasing removes every check-in and journal entry for good."),
      h("button", { class: "danger", type: "button", onclick: eraseData }, "Erase all my entries"),
    ),
    h("button", { type: "button", onclick: () => onSignedOut() }, "Sign out"),
  ];
}
