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
  username: {
    type: DataTypes.STRING,
    primaryKey: true,
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
const Emotion = sequelize.define("emotion", {
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
// User.hasMany(Day, { foreignKey: "username" });
// Day.belongsTo(User, { foreignKey: "username" });

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
    try {
      const existingDay = await Day.findByPk(day.date_id);
      if (existingDay) {
        return await this.update(day);
      }
      const newDay = await Day.create(day, {
        include: [Emotion],
      });
      return newDay.toJSON();
    } catch (error) {
      console.error("Error creating day:", error.message);
      return null;
    }
  }

  async read(id = null) {
    try {
      if (id) {
        const day = await Day.findByPk(id, {
          include: [Emotion],
        });
        return day;
      }
      const allDays = await Day.findAll({
        include: [Emotion],
      });
      return allDays.map((day) => day.toJSON());
    } catch (error) {
      console.error("Error reading data:", error.message);
      return null;
    }
  }

  async update(day) {
    try {
      const existingDay = await Day.findByPk(day.date_id);
      if (existingDay) {
        await existingDay.update(day);
        if (day.emotions) {
          await Emotion.destroy({ where: { date_id: day.date_id } });
          await Emotion.bulkCreate(day["emotions"]);
        }
        return existingDay.toJSON();
      }
      return null;
    } catch (error) {
      console.error("Error updating day:", error.message);
      return null;
    }
  }

  async delete(day = null) {
    try {
      if (day === null) {
        await Day.destroy({ truncate: true });
        await Emotion.destroy({ truncate: true });
        return;
      }
      await Day.destroy({ where: { date_id: day.date_id } });
      await Emotion.destroy({ where: { date_id: day.date_id } });
      return day;
    } catch (error) {
      console.error("Error deleting data:", error.message);
      return;
    }
  }
}

const SQLiteDayModel = new _SQLiteDayModel();

export default SQLiteDayModel;
