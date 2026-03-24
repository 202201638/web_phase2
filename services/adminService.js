const mongoose = require("mongoose");

const User = require("../models/User");
const Video = require("../models/Video");
const Review = require("../models/Review");
const Follower = require("../models/Follower");
const AppError = require("../utils/AppError");

const getAdminHealth = async () => ({
  uptimeSeconds: process.uptime(),
  timestamp: new Date().toISOString(),
  database: {
    state: mongoose.connection.readyState,
    isConnected: mongoose.connection.readyState === 1,
  },
});

const getAdminStats = async () => {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalUsers, totalVideos, weeklyVideos, weeklyReviews, weeklyFollows] =
    await Promise.all([
      User.countDocuments(),
      Video.countDocuments(),
      Video.aggregate([
        { $match: { createdAt: { $gte: weekAgo } } },
        { $group: { _id: "$owner", videoCount: { $sum: 1 } } },
      ]),
      Review.aggregate([
        { $match: { createdAt: { $gte: weekAgo } } },
        { $group: { _id: "$user", reviewCount: { $sum: 1 } } },
      ]),
      Follower.aggregate([
        { $match: { createdAt: { $gte: weekAgo } } },
        { $group: { _id: "$followerid", followCount: { $sum: 1 } } },
      ]),
    ]);

  const activityMap = new Map();

  const applyActivity = (items, keyName) => {
    items.forEach((item) => {
      const key = item._id.toString();
      const existing = activityMap.get(key) || { userId: key, score: 0 };
      existing.score += item[keyName];
      activityMap.set(key, existing);
    });
  };

  applyActivity(weeklyVideos, "videoCount");
  applyActivity(weeklyReviews, "reviewCount");
  applyActivity(weeklyFollows, "followCount");

  const ranked = Array.from(activityMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const userIds = ranked.map((entry) => entry.userId);
  const users = await User.find({ _id: { $in: userIds } }).select("username email");
  const userMap = new Map(users.map((user) => [user._id.toString(), user]));

  const mostActiveUsersOfWeek = ranked.map((entry) => ({
    userId: entry.userId,
    username: userMap.get(entry.userId)?.username || "Unknown",
    email: userMap.get(entry.userId)?.email || null,
    activityScore: entry.score,
  }));

  return {
    totals: {
      users: totalUsers,
      videos: totalVideos,
      tipsProcessed: 0,
    },
    mostActiveUsersOfWeek,
  };
};

const softDeleteUser = async ({ userId, payload }) => {
  const user = await User.findByIdAndUpdate(
    userId,
    {
      active: payload?.active ?? false,
      accountstatus: payload?.accountstatus || "deactivated",
    },
    { returnDocument: "after", runValidators: true }
  ).select("-hashedPassword");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

const getModerationQueue = async () => {
  const flaggedVideos = await Video.find({ status: "flagged" })
    .sort({ updatedAt: -1 })
    .populate("owner", "username email");

  const lowRatedVideos = await Review.aggregate([
    {
      $group: {
        _id: "$video",
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
    { $match: { averageRating: { $lte: 2.5 } } },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "_id",
        as: "video",
      },
    },
    { $unwind: "$video" },
    {
      $project: {
        _id: 0,
        videoId: "$video._id",
        title: "$video.title",
        status: "$video.status",
        averageRating: 1,
        reviewCount: 1,
      },
    },
    { $sort: { averageRating: 1, reviewCount: -1 } },
  ]);

  return { flaggedVideos, lowRatedVideos };
};

module.exports = {
  getAdminHealth,
  getAdminStats,
  softDeleteUser,
  getModerationQueue,
};
