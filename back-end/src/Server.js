// Server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import DayRoutes from "./routes/DayRoutes.js";

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Server {
  constructor() {
    this.app = express();
    this.configureMiddleware();
    this.setupRoutes();
  }

  // Configure middleware for static files and JSON parsing
  configureMiddleware() {
    // Serve static files from the front-end
    this.app.use(express.static(path.join(__dirname, "../../front-end/src")));

    // Parse JSON bodies, limited to 10mb
    this.app.use(express.json({ limit: "10mb" }));

    // Serve JavaScript files with the correct MIME type
    this.app.use((req, res, next) => {
      if (req.path.endsWith(".js")) {
        res.setHeader("Content-Type", "text/javascript");
      } else if (req.path.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css");
      } else if (req.path.endsWith(".json")) {
        res.setHeader("Content-Type", "application/json");
      } else if (req.path.endsWith(".html")) {
        res.setHeader("Content-Type", "text/html");
      } else if (req.path.endsWith("/")) {
        res.setHeader("Content-Type", "text/html");
      } else {
        res.setHeader("Content-Type", "text/plain");
      }
      next();
    });

    // Set Content Security Policy headers
    this.app.use((req, res, next) => {
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data:; font-src 'self' https://fonts.googleapis.com; connect-src 'self';"
      );
      next();
    });

    this.app.use((req, res, next) => {
      console.log(`${req.method} ${req.path}`);
      next();
    });
  }

  // Setup the routes for the server
  setupRoutes() {
    this.app.use("/v1", DayRoutes);

    // Serve the main HTML file for all other routes
    // this.app.get("*", (req, res) => {
    //   res.sendFile(path.join(__dirname, "../../front-end/src/index.html"));
    // });
  }

  // Start the server on a specified port
  start(port = 3000) {
    this.app.listen(port, () => {
      console.log(`Server started on port ${port}`);
    });
  }
}

// Initialize and start the server
console.log("Starting server...");
const server = new Server();
server.start();
