const Follower = require("../models/Follower");
const User = require("../models/User");
const AppError = require("../utils/AppError");

const followUser = async ({ currentUserId, targetUserId }) => {
  if (currentUserId.toString() === targetUserId.toString()) {
    throw new AppError("Users cannot follow themselves", 400);
  }

  const targetUser = await User.findById(targetUserId).select("_id active");
  if (!targetUser || !targetUser.active) {
    throw new AppError("Target user not found", 404);
  }

  const relation = await Follower.create({
    followerid: currentUserId,
    followingid: targetUserId,
  });

  return relation;
};

const unfollowUser = async ({ currentUserId, targetUserId }) => {
  const result = await Follower.findOneAndDelete({
    followerid: currentUserId,
    followingid: targetUserId,
  });

  if (!result) {
    throw new AppError("Follow relationship not found", 404);
  }
};

const listFollowers = async (targetUserId) => {
  const targetUser = await User.findById(targetUserId).select("_id active");
  if (!targetUser || !targetUser.active) {
    throw new AppError("Target user not found", 404);
  }

  return Follower.find({ followingid: targetUserId })
    .populate("followerid", "username bio avatarKey")
    .select("followerid createdAt");
};

const listFollowing = async (targetUserId) => {
  const targetUser = await User.findById(targetUserId).select("_id active");
  if (!targetUser || !targetUser.active) {
    throw new AppError("Target user not found", 404);
  }

  return Follower.find({ followerid: targetUserId })
    .populate("followingid", "username bio avatarKey")
    .select("followingid createdAt");
};

module.exports = { followUser, unfollowUser, listFollowers, listFollowing };
