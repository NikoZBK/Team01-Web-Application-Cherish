import config from "../../config/config.js";
import { debugLog } from "../../config/debug.js";
import { Sequelize, DataTypes } from "sequelize";

// Initialize a new Sequelize instance with SQLite
const sequelize = new Sequelize({
  dialect: "sqlite",
  // Create a test database if debug .env var is set to true
  storage: config.debug ? "database_test.sqlite" : "database.sqlite",
});

// Define the User model
const User = sequelize.define("User", {
  user_id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
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
User.hasMany(Day, { foreignKey: "user_id" });
Day.belongsTo(User, { foreignKey: "user_id" });

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
}

const SQLiteDayModel = new _SQLiteDayModel();

export default SQLiteDayModel;
