import { ApiError, login, register } from "../api/client.js";
import { h } from "../ui/dom.js";

const MIN_PASSWORD = 12;

function explain(error, creating) {
  if (error instanceof ApiError) {
    if (error.status === 401) return "That email and password do not match an account.";
    if (error.status === 409) return "There is already an account for that email. Sign in instead.";
    if (error.status === 429) return "Too many attempts. Wait a minute and try again.";
    if (error.status === 400 || error.status === 422) {
      return creating
        ? `Enter a valid email and a password of ${MIN_PASSWORD} to 128 characters.`
        : "Enter your email and password.";
    }
  }
  return "Cherish could not reach the server. Check that it is running and try again.";
}

/** Sign-in and create-account form. Calls `onSignedIn(user)` when a session starts. */
export function loginView({ onSignedIn }) {
  let creating = false;

  const email = h("input", { id: "email", type: "email", autocomplete: "username", required: true });
  const name = h("input", { id: "name", type: "text", autocomplete: "name", maxLength: 80 });
  const password = h("input", { id: "password", type: "password", required: true, maxLength: 128 });
  const nameField = h("div", { class: "field" }, h("label", { for: "name" }, "Name (optional)"), name);
  const hint = h("p", { class: "hint" }, `At least ${MIN_PASSWORD} characters.`);
  const error = h("p", { class: "error", role: "alert" });
  const submit = h("button", { class: "primary", type: "submit" });
  const title = h("h1");
  const switchText = h("span");
  const switchButton = h("button", { class: "link", type: "button", onclick: () => setMode(!creating) });

  function setMode(next) {
    creating = next;
    title.textContent = creating ? "Create your account" : "Welcome back";
    submit.textContent = creating ? "Create account" : "Sign in";
    switchText.textContent = creating ? "Already have an account? " : "New to Cherish? ";
    switchButton.textContent = creating ? "Sign in" : "Create an account";
    nameField.hidden = !creating;
    hint.hidden = !creating;
    password.autocomplete = creating ? "new-password" : "current-password";
    password.minLength = creating ? MIN_PASSWORD : 0;
    error.textContent = "";
  }

  async function onSubmit(event) {
    event.preventDefault();
    error.textContent = "";
    submit.disabled = true;
    try {
      const address = email.value.trim();
      const user = creating
        ? await register(address, password.value, name.value.trim() || address.split("@")[0])
        : await login(address, password.value);
      onSignedIn(user);
    } catch (failure) {
      error.textContent = explain(failure, creating);
      submit.disabled = false;
    }
  }

  setMode(false);

  return h(
    "main",
    { class: "login" },
    h("p", { class: "logo", "aria-hidden": "true" }, "🌱"),
    title,
    h("p", { class: "muted" }, "Cherish is a private calendar for your moods and thoughts."),
    h(
      "form",
      { class: "card", onsubmit: onSubmit },
      h("div", { class: "field" }, h("label", { for: "email" }, "Email"), email),
      nameField,
      h("div", { class: "field" }, h("label", { for: "password" }, "Password"), password, hint),
      error,
      submit,
    ),
    h("p", { class: "muted" }, switchText, switchButton),
  );
}
