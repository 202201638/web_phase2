const videoService = require("../services/videoService");
const { validateVideoDuration, cleanupFile, generateThumbnail } = require("../middleware/upload");
const asyncHandler = require("../middleware/asyncHandler");
const AppError = require("../utils/AppError");



const createVideo = asyncHandler(async (req, res) => {

  console.log("Video upload request received");
  console.log("File:", req.file);
  console.log("Body:", req.body);
  console.log("User:", req.user);

  if (!req.file) {

    throw new AppError("No video file uploaded", 400);

  }



  try {

    // Use default values to avoid FFmpeg issues
    const duration = 60; // Default 1 minute
    const thumbnail = null;

    console.log("Using default duration:", duration);

    // Prepare video data

    const videoData = {

      title: req.body.title,

      description: req.body.description || "",

      videoURL: `/uploads/${req.file.filename}`, // Store relative path

      thumbnail: thumbnail, // Save thumbnail path

      duration: duration,

      timestamps: [],

      status: "public"

    };



    const video = await videoService.createVideo(req.user._id, videoData);

    console.log("Video created successfully:", video._id);

    res.status(201).json({ success: true, data: video });

  } catch (error) {

    console.error("Error creating video:", error);
    console.error("Error stack:", error.stack);

    // Clean up file on error only

    if (req.file && req.file.path) {
      await cleanupFile(req.file.path);
    }

    throw error;

  }

});



const getPublicVideos = asyncHandler(async (_req, res) => {

  const videos = await videoService.getPublicFeed();

  res.status(200).json({ success: true, data: videos });

});



const getVideoById = asyncHandler(async (req, res) => {

  const video = await videoService.getVideoById(req.params.id);

  if (!video) {

    return res.status(404).json({ success: false, error: { message: "Video not found" } });

  }

  res.status(200).json({ success: true, data: video });

});



const updateVideo = asyncHandler(async (req, res) => {

  const updated = await videoService.updateVideo(req.video, req.body);

  res.status(200).json({ success: true, data: updated });

});



const deleteVideo = asyncHandler(async (req, res) => {

  await videoService.deleteVideo(req.video);

  res.status(200).json({ success: true, message: "Video deleted successfully" });

});



const getUserReview = asyncHandler(async (req, res) => {

  const review = await videoService.getUserReview(req.params.id, req.user._id);

  res.status(200).json({ success: true, data: review });

});



const getVideoReviews = asyncHandler(async (req, res) => {

  const reviews = await videoService.getVideoReviews(req.params.id);

  res.status(200).json({ success: true, data: reviews });

});



const createReview = asyncHandler(async (req, res) => {

  const review = await videoService.createReview({

    userId: req.user._id,

    videoId: req.params.id,

    payload: req.body,

  });

  res.status(201).json({ success: true, data: review });

});



const updateReview = asyncHandler(async (req, res) => {

  const review = await videoService.updateReview(req.params.id, req.user._id, req.body);

  res.status(200).json({ success: true, data: review });

});



const deleteReview = asyncHandler(async (req, res) => {

  await videoService.deleteReview(req.params.id, req.user._id);

  res.status(200).json({ success: true, message: "Review deleted successfully" });

});



const likeVideo = asyncHandler(async (req, res) => {

  const video = await videoService.likeVideo(req.params.id, req.user._id);

  // Emit real-time like notification
  try {
    const { getIO } = require("../config/socket");
    const io = getIO();
    
    // Emit to the video owner
    io.to(video.owner._id.toString()).emit('new-like', {
      likerUsername: req.user.username,
      videoTitle: video.title,
      videoId: video._id,
      timestamp: new Date().toISOString()
    });

    // Emit to video room for real-time updates
    io.to(`video-${video._id}`).emit('like-update', {
      videoId: video._id,
      action: 'liked',
      userId: req.user._id,
      likes: video.likes
    });

    console.log(`Like notification sent to user ${video.owner._id} for video ${video.title}`);
  } catch (socketError) {
    console.error('Error emitting like notification:', socketError);
  }

  res.status(200).json({ success: true, data: video });

});



const unlikeVideo = asyncHandler(async (req, res) => {

  const video = await videoService.unlikeVideo(req.params.id, req.user._id);

  res.status(200).json({ success: true, data: video });

});



const getFollowingFeed = asyncHandler(async (req, res) => {

  const { skip = 0, limit = 12, search, sortBy } = req.query;

  const videos = await videoService.getFollowingFeed(req.user._id, {

    skip: parseInt(skip),

    limit: parseInt(limit),

    search,

    sortBy

  });

  res.status(200).json({ success: true, data: videos });

});



const getTrendingFeed = asyncHandler(async (req, res) => {

  const { skip = 0, limit = 12, search, sortBy } = req.query;

  const videos = await videoService.getTrendingFeed({

    skip: parseInt(skip),

    limit: parseInt(limit),

    search,

    sortBy

  });

  res.status(200).json({ success: true, data: videos });

});



const getUserVideos = asyncHandler(async (req, res) => {

  const videos = await videoService.getUserVideos(req.user._id);

  res.status(200).json({ success: true, data: videos });

});

const getLikedVideos = asyncHandler(async (req, res) => {
  const videos = await videoService.getLikedVideos(req.user._id);
  res.status(200).json({ success: true, data: videos });
});


module.exports = {

  createVideo,

  getPublicVideos,

  getVideoById,

  updateVideo,

  deleteVideo,

  getUserReview,

  getVideoReviews,

  createReview,

  updateReview,

  deleteReview,

  likeVideo,

  unlikeVideo,

  getFollowingFeed,

  getTrendingFeed,

  getUserVideos,

  getLikedVideos,

};

