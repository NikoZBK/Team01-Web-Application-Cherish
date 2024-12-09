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

// maybe try to add a week model!!!!!!!

/// maybe try too keep track of the week.

const Week = sequelize.define("Week", {
  date_id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  // data that correspond for a week.
  //average rating. 
  // we need a new id. that keeps track of the week. and looks back at the prevoius week.
  // create  a weekk model, then create a week day_route, so the server nows the server needs to get the week data. and 
  // I might need create a function on sqliteDayModel that gets the week data.
  // daycontroller new function that gets the week data.
  // then create the week component.
  // MAKE SURE I ADD THIS FOR THE ISSUE CREATE 4 NEW ISSEUS AND EACH OF THEM IS ABOUT THE FEATURE.
  // WORRY ABOUT THIS TAKS !!!! 
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // key for the tables 
  journal: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});


// Define the relationships
// User.hasMany(Day, { foreignKey: "username" });
// Day.belongsTo(User, { foreignKey: "username" });

Day.hasMany(Emotion, { foreignKey: "date_id" });
Emotion.belongsTo(Day, { foreignKey: "date_id" });
Week.hasMany(Emotion, { foreignKey: "date_id" });

class _SQLiteDayModel {
  constructor() {}

  async init(fresh = false) {
    await sequelize.authenticate();
    // debugLog("Sequelize has been authenticated successfully.");
    await sequelize.sync({ force: fresh });
    // debugLog("All models were synchronized successfully.");
    if (fresh) {
      await this.delete();M
      // Create test data
      await this.create({
        date_id: "10-10-1010",
        rating: 5,
        journal: "Test journal entry",
      });
      await this.create({
        date_id: "10-11-1010",
        rating: 4,
        journal: "Another test journal entry",
      });
      await this.create({
        date_id: "10-12-1010",
        rating: 3,
        journal: "Yet another test journal entry",
      });
    }
  }

  async create(day) {
    try {
      if (await Day.findByPk(day.date_id)) {
        debugLog("Day already exists. Try updating instead.");
        return null;
      }
      return await Day.create(day);
    } catch (error) {
      console.error("Error creating day:", error.message);
      return null;
    }
  }

  async read(id = null) {
    try {
      if (id) {
        const day = await Day.findByPk(id);
        return day;
      }
      const allDays = await Day.findAll();
      return allDays;
    } catch (error) {
      console.error("Error reading data:", error.message);
      return null;
    }
  }

  async update(day) {
    const updatedDay = await Day.findByPk(day.date_id);
    if (updatedDay) {
      await updatedDay.update(day);
      return updatedDay.get({ plain: true });
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
