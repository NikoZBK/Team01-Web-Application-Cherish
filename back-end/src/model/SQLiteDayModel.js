import { Sequelize, DataTypes } from "sequelize";
import { Emotion } from "./Emotion";

// Initialize a new Sequelize instance with SQLite
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "database.sqlite",
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

const Emotion = sequelize.define("Emotion", {
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

// Define the relationship between Day and Emotion
Day.belongsToMany(Emotion, { through: "DayEmotion" });
Emotion.hasOne(Day);

class _SQLiteDayModel {}
