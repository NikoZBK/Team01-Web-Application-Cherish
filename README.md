# Team01 Web Application - Cherish

## Back-End Features

### Overview
The back-end of the Cherish application is designed to handle data storage, retrieval, and server-side logic. It is built using Node.js and Express, with Sequelize as the ORM for database interactions. The back-end ensures efficient data management and seamless communication with the front-end.

### Features

#### 1. Express Server
- **Description**: The back-end server is built using Express.js, providing a robust framework for handling HTTP requests and responses.
- **Main File**: `back-end/src/Server.js`
- **Start Command**: `npm run start-server`

#### 2. Database Integration
- **Description**: The back-end uses SQLite3 as the database, managed through Sequelize ORM. This setup allows for efficient data storage and retrieval.
- **Dependencies**:
    - `sequelize`: "^6.37.5"
    - `sqlite3`: "^5.1.7"

#### 3. API Endpoints
- **Description**: The server exposes various API endpoints to handle CRUD operations for different data entities. These endpoints facilitate communication between the front-end and the database.
- **Example Endpoints**:
    - `GET /v1/calendar/:id`: Retrieve data
    - `POST /v1/calendar/:id`: Add new data
    - `PUT /v1/calendar/:id`: Update existing data
    - `DELETE /v1/calendar/:id`: Delete data

#### 4. Data Models
- **Description**: Data models are defined using Sequelize to represent different entities in the application. These models include definitions for fields, data types, and relationships.
- **Example Models**:
    - `User`
    - `JournalEntry`
    - `EmotionLog`

#### 5. Middleware
- **Description**: Custom middleware functions are used to handle tasks such as request validation, authentication, and error handling.
- **Example Middleware**:
    - `authMiddleware.js`: Handles user authentication
    - `errorHandler.js`: Centralized error handling

#### 6. Configuration
- **Description**: Configuration settings for the back-end are managed through environment variables and configuration files. This includes database connection settings, server ports, and other environment-specific variables.
- **Configuration File**: `.env`

### Getting Started

#### Prerequisites
- Node.js
- npm (Node Package Manager)

#### Installation
1. Clone the repository:
     ```bash
     git clone https://github.com/rthurston1/Team01-Web-Application-Cherish.git
     ```
2. Navigate to the back-end directory:
     ```bash
     cd back-end
     ```
3. Install dependencies:
     ```bash
     npm install
     ```

#### Running the Server
1. Start the server:
     ```bash
     npm start
     ```
2. The server will be running at `http://localhost:3000`.

### License
This project is licensed under the COMPSCI 326 license.

### Authors
Team 1

