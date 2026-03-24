const Video = require("../models/Video");
const Review = require("../models/Review");
const AppError = require("../utils/AppError");

const createVideo = async (ownerId, payload) => {
  const video = await Video.create({
    ...payload,
    owner: ownerId,
  });

  return video;
};

const getPublicFeed = async () =>
  Video.find({ status: "public" })
    .sort({ createdAt: -1 })
    .populate("owner", "username avatarKey");

const updateVideo = async (videoDoc, payload) => {
  if (payload.title !== undefined) {
    videoDoc.title = payload.title;
  }
  if (payload.description !== undefined) {
    videoDoc.description = payload.description;
  }
  await videoDoc.save();
  return videoDoc;
};

const deleteVideo = async (videoDoc) => {
  await Video.findByIdAndDelete(videoDoc._id);
};

const createReview = async ({ userId, videoId, payload }) => {
  const video = await Video.findById(videoId);
  if (!video) {
    throw new AppError("Video not found", 404);
  }

  if (video.status !== "public") {
    throw new AppError("Only public videos can be reviewed", 403);
  }

  const review = await Review.create({
    ...payload,
    user: userId,
    video: videoId,
  });

  return review;
};

module.exports = {
  createVideo,
  getPublicFeed,
  updateVideo,
  deleteVideo,
  createReview,
};
