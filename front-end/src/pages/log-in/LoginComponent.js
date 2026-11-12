import { BaseComponent } from "../../BaseComponent.js";
import { Events } from "../../eventhub/Events.js";
import { DATABASE } from "../../main.js"; // Import the database service


export class LoginComponent extends BaseComponent {
  constructor() {
    super("login", "./pages/log-in/LoginStyles.css");
  }

  _buildHTML() {
    return `
      <div class="login-container">
        <h2>Login</h2>
        <h3 id="login-error">Enter Email and Password</h3>
        <form id="login-form">
          <input type="email" id="username" placeholder="Email" autocomplete="username" required />
          <input type="password" id="password" placeholder="Password (12+ characters)" autocomplete="current-password" required />
          <button type="submit">Log In</button>
        </form>
        <button id="signup-button" class="secondary-btn">Sign Up</button>
      </div>
    `;
  }

  _addEventListeners() {
    const loginForm = document.getElementById("login-form");
    const loginError = document.getElementById("login-error");
    const signup = document.getElementById("signup-button");

    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value;

      try {
        const userData = await DATABASE.loginUser(username, password);
        if (!userData) return;

        this.update(Events.LoginSuccess, userData); // Notify other components of login success  

      } catch (error) {
        loginError.textContent = this._errorMessage(error, "Invalid email or password");
      } 
    });

    signup.addEventListener("click", async() => {
      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value;

      if (!loginForm.reportValidity()) return;
      if (password.length < 12) {
        loginError.textContent = "Password must be at least 12 characters";
        return;
      }

      try {
        // Creating an account also signs you in
        const userData = await DATABASE.registerUser(username, password);
        if (!userData) return;

        this.update(Events.LoginSuccess, userData);
      } catch (error) {
        loginError.textContent = this._errorMessage(error, "Couldn't register account");
      }

      
    });

  
  }

  // Picks the text to show for a failed request
  _errorMessage(error, fallback) {
    switch (error.problem?.status) {
      case 401:
        return "Invalid email or password";
      case 409:
        return "An account with this email already exists";
      case 429:
        return "Too many attempts. Try again in a minute";
      default:
        return fallback;
    }
  }

  // Render the login component
  _render() {
    this.bodyElement.style.display = "block";
  }
}
