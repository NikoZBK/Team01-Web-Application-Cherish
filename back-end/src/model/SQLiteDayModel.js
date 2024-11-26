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

class _SQLiteDayModel {
  constructor() {}

  async init(fresh = false) {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });

    if (fresh) {
      await this.delete();
    }
  }

  async create(day) {
    return await Day.create(day);
  }

  async read(id = null) {
    if (id) {
      return await Day.findByPk(id);
    }
    return await Day.findAll();
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
    if (day === null) {
      await Day.destroy({ truncate: true });
      return;
    }

    await Day.destroy({ where: { date_id: day.date_id } });
    return day;
  }
}

const SQLiteDayModel = new _SQLiteDayModel();

export default SQLiteDayModel;
