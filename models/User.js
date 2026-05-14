const mongoose = require("mongoose");

const notificationToggleSchema = new mongoose.Schema(
  {
    followers: { type: Boolean, default: true },
    comments: { type: Boolean, default: true },
    likes: { type: Boolean, default: true },
    tips: { type: Boolean, default: true },
  },
  { _id: false }
);

const notificationPreferencesSchema = new mongoose.Schema(
  {
    inApp: { type: notificationToggleSchema, default: () => ({}) },
    email: { type: notificationToggleSchema, default: () => ({}) },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    hashedPassword: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    bio: {
      type: String,
      default: "",
      maxlength: 500,
      trim: true,
    },
    avatarKey: {
      type: String,
      default: "",
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    accountstatus: {
      type: String,
      default: "active",
      trim: true,
    },
    /** Pending tip balance in cents — incremented on completed Stripe checkout */
    walletBalance: {
      type: Number,
      default: 0,
    },
    notificationPreferences: {
      type: notificationPreferencesSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
