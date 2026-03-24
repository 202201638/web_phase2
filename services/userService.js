const User = require("../models/User");
const Video = require("../models/Video");
const Follower = require("../models/Follower");
const AppError = require("../utils/AppError");

const getMe = async (userId) => {
  const user = await User.findById(userId).select("-hashedPassword");
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return user;
};

const updateMe = async (userId, payload) => {
  const allowedUpdates = {
    username: payload.username,
    bio: payload.bio,
    avatarKey: payload.avatarKey,
  };

  const user = await User.findByIdAndUpdate(userId, allowedUpdates, {
    returnDocument: "after",
    runValidators: true,
  }).select("-hashedPassword");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

const getPublicProfileById = async (id) => {
  const user = await User.findById(id).select(
    "username bio avatarKey role accountstatus createdAt active"
  );
  if (!user || !user.active) {
    throw new AppError("User not found", 404);
  }

  const [followersCount, followingCount, videosCount] = await Promise.all([
    Follower.countDocuments({ followingid: id }),
    Follower.countDocuments({ followerid: id }),
    Video.countDocuments({ owner: id, status: "public" }),
  ]);

  return {
    ...user.toObject(),
    stats: {
      followersCount,
      followingCount,
      videosCount,
    },
  };
};

const updatePreferences = async (userId, preferencesPayload) => {
  const update = {};

  if (preferencesPayload.inApp) {
    Object.entries(preferencesPayload.inApp).forEach(([key, value]) => {
      update[`notificationPreferences.inApp.${key}`] = value;
    });
  }

  if (preferencesPayload.email) {
    Object.entries(preferencesPayload.email).forEach(([key, value]) => {
      update[`notificationPreferences.email.${key}`] = value;
    });
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: update },
    { returnDocument: "after" }
  ).select(
    "notificationPreferences username email"
  );

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

module.exports = {
  getMe,
  updateMe,
  getPublicProfileById,
  updatePreferences,
};
