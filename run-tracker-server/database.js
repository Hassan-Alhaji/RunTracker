const { Sequelize, DataTypes } = require('sequelize');

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
      logging: false
    })
  : new Sequelize({
      dialect: 'sqlite',
      storage: './new_database.sqlite', // Local fallback
      logging: false
    });

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true // Allow null initially if just logging in, or require it
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user'
  },
  total_distance: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  },
  // --- OTP Fields ---
  otp_code: {
    type: DataTypes.STRING, // Store as string even if digits
    allowNull: true
  },
  otp_expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  strava_access_token: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  strava_refresh_token: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  strava_token_expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

const Activity = sequelize.define('Activity', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  strava_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  strava_url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  distance: {
    type: DataTypes.FLOAT, // Kilometers
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER, // Seconds
    allowNull: false
  },
  pace: {
    type: DataTypes.STRING, // e.g., "05:30"
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  }
});

// Relationships
User.hasMany(Activity);
Activity.belongsTo(User);

module.exports = { sequelize, User, Activity };
