import config from "../../config/config.js";
import { debugLog } from "../../config/debug.js";
import { Sequelize, DataTypes, Op } from "sequelize";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Initialize a new Sequelize instance with SQLite
const sequelize = new Sequelize({
  dialect: "sqlite",
  // Create a test database if debug .env var is set to true
  storage: config.debug ? "database_test.sqlite" : "database.sqlite",
});

// Define the User model
const User = sequelize.define("User", {
  username: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: "user" // Roles: User, Admin
  }
});

// Define the Day model
const Day = sequelize.define("Day", {
  date_id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  journal: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});
// Define the Emotion model
const Emotion = sequelize.define("Emotion", {
  date_id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
  },
  emotion_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  magnitude: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  timestamp: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// Define the relationships
User.hasMany(Day, { foreignKey: "username" });
Day.belongsTo(User, { foreignKey: "username" });

Day.hasMany(Emotion, { foreignKey: "date_id" });
Emotion.belongsTo(Day, { foreignKey: "date_id" });

class _SQLiteDayModel {
  constructor() {}

  async init(fresh = false) {
    await sequelize.authenticate();
    // debugLog("Sequelize has been authenticated successfully.");
    await sequelize.sync({ force: fresh });
    // debugLog("All models were synchronized successfully.");
    if (fresh) {
      await this.delete();
    }
  }

  // User Authentication

  // Checks if username already exists in the database
  async userExists(username) {
    return await User.findOne({ where: { username } });
  }

  async createUser(user) {
    try {
      // Check if valid username and email exist
      const existsUser = await this.userExists(user.username);

      if (existsUser) {
        debugLog(`Username ${user.username} already taken.`);
        return { success: false, message: "Username already taken." };
      }

      // Hash password and create user
      user.password = await bcrypt.hash(user.password, 10);
      const createdUser = await User.create(user);
      
      debugLog(`User ${user.username} created successfully.`);
      return { success: true, user: createdUser };

    } catch (error) { // Any error creating a user
      debugLog(`Error creating user: ${error.message}`);
      return { success: false, message: "Error creating user." };
    }
  }

  async deleteUser(username) {
    try {
      // Finds the user by username
      const user = await this.userExists(username);
      if (!user) {
        throw new Error("User not found");
      }
  
      // Deletes the user from the database
      await user.destroy();
      return { success: true, message: "User deleted successfully" };
    } catch (error) {
      debugLog(`Error deleting user: ${error.message}`);
      return { success: false, message: "User deletion failed" };
    }
  }
  

  /**
   * Attempts to the user into their account.
   * 
   * @param {String} username an inputted username
   * @param {String} password an inputted password
   * @returns the user's data
   */
  async loginUser(username, password) {
    try {
      // Finds user in the database
      const user = await User.findByPk(username); 
      if (!user) {
        throw new Error("User not found");
      }

      // Checks for valid password (compares typed-in password with the encrypted one)
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        throw new Error("Invalid password");
      }



      // User has successfully logged in
      return {success: true, message: "Login successful", user};
    } catch (error) {
      debugLog(`Error logging in: ${error.message}`);
      return { success: false, message: "Login failed." };
    }
  }

  // Day
  async create(day) {
    const test = await Day.findByPk(day.date_id);
    debugLog(`create: ${test}`);
    if (await Day.findByPk(day.date_id)) {
      debugLog("Day already exists. Try updating instead.");
      return null;
    }
    return await Day.create(day);
  }

  async read(id = null) {
    if (id) {
      debugLog(`read: ${id}`);
      const day = await Day.findByPk(id);
      debugLog(`read: ${day}`);
      debugLog(`typeof day: ${typeof day}`);
      return day;
    }
    const allDays = await Day.findAll();
    debugLog(`read: ${allDays}`);
    debugLog(`typeof allDays: ${typeof allDays}`);
    return allDays;
  }

  async update(day) {
    const updatedDay = await Day.findByPk(day.date_id);
    if (updatedDay) {
      await updatedDay.update(day);
      return updatedDay;
    }
    return null;
  }

  async delete(day = null) {
    try {
      if (day === null) {
        await Day.destroy({ truncate: true });
        return;
      }

      await Day.destroy({ where: { date_id: day.date_id } });
      return day;
    } catch (error) {
      console.error("Error deleting data:", error.message);
      return;
    }
  }

  async readYear(year) { // Match any date_id that ends with '-year'
    const yearlyData = await Day.findAll({where: {date_id: {[Op.like]: `%-%-${year}`}}});
    debugLog(`read: ${yearlyData}`);
    debugLog(`typeof yearlyData: ${typeof yearlyData}`);
    return yearlyData;
  }

  async readMonth(month, year) { //  Match any date_id in format 'month-xx-year'
    const monthlyData = await Day.findAll({where: {date_id: {[Op.like]: `${month}-%-${year}`}}});
    debugLog(`read: ${monthlyData}`);
    debugLog(`typeof monthlyData: ${typeof monthlyData}`);
    return monthlyData;
  }
}

const SQLiteDayModel = new _SQLiteDayModel();

export default SQLiteDayModel;
