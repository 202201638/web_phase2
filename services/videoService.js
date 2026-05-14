const Video = require("../models/Video");

const Review = require("../models/Review");

const AppError = require("../utils/AppError");



const createVideo = async (ownerId, payload) => {

  console.log("Creating video with owner:", ownerId);
  console.log("Video payload:", payload);

  const video = await Video.create({

    ...payload,

    owner: ownerId,

  });



  console.log("Video saved to database:", video._id);

  return video;

};



const getPublicFeed = async () => {

  const videos = await Video.find({ status: "public" })

    .sort({ createdAt: -1 })

    .populate("owner", "username avatarKey")

    .lean();

  

  // Transform field names and add reviews count

  return videos.map(video => ({

    ...video,

    videoURL: video.videoURL, // Keep videoURL field name

    reviews: video.reviewCount || 0 // Use saved review count

  }));

};



const getVideoById = async (videoId) => {

  const video = await Video.findById(videoId)

    .populate("owner", "username avatarKey")

    .lean();

  

  if (!video) return null;

  

  // Keep videoURL field name for frontend compatibility

  return {

    ...video,

    videoURL: video.videoURL, // Keep videoURL field name

    reviews: video.reviewCount || 0 // Use saved review count

  };

};



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



const getUserReview = async (videoId, userId) => {

  const review = await Review.findOne({ video: videoId, user: userId });

  return review;

};



const getVideoReviews = async (videoId) => {

  const reviews = await Review.find({ video: videoId })

    .populate('user', 'username avatarKey')

    .sort({ createdAt: -1 });

  return reviews;

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



  // Update video's review count and average rating

  const reviews = await Review.find({ video: videoId });

  const reviewCount = reviews.length;

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount;

  

  await Video.findByIdAndUpdate(videoId, { 

    reviewCount: reviewCount,

    avgRating: Math.round(avgRating * 100) / 100 // Round to 2 decimal places

  });



  return review;

};



const updateReview = async (videoId, userId, payload) => {

  const review = await Review.findOne({ video: videoId, user: userId });

  if (!review) {

    throw new AppError("Review not found", 404);

  }

  

  if (payload.rating !== undefined) {

    review.rating = payload.rating;

  }

  if (payload.comment !== undefined) {

    review.comment = payload.comment;

  }

  

  await review.save();

  

  // Update video's average rating

  const reviews = await Review.find({ video: videoId });

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  

  await Video.findByIdAndUpdate(videoId, { 

    avgRating: Math.round(avgRating * 100) / 100 // Round to 2 decimal places

  });

  

  return review;

};



const deleteReview = async (videoId, userId) => {

  const result = await Review.deleteOne({ video: videoId, user: userId });

  if (result.deletedCount === 0) {

    throw new AppError("Review not found", 404);

  }

  

  // Update video's review count and average rating

  const reviews = await Review.find({ video: videoId });

  const reviewCount = reviews.length;

  const avgRating = reviewCount > 0 

    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount 

    : 0;

  

  await Video.findByIdAndUpdate(videoId, { 

    reviewCount: reviewCount,

    avgRating: Math.round(avgRating * 100) / 100 // Round to 2 decimal places

  });

};



const likeVideo = async (videoId, userId) => {

  const video = await Video.findById(videoId);

  if (!video) {

    throw new AppError("Video not found", 404);

  }



  // Initialize likedBy array if it doesn't exist

  if (!video.likedBy) {

    video.likedBy = [];

  }

  

  // Initialize likes if it doesn't exist

  if (typeof video.likes !== 'number') {

    video.likes = 0;

  }



  if (!video.likedBy.includes(userId)) {

    video.likedBy.push(userId);

    video.likes += 1;

  }



  await video.save();

  return video;

};



const unlikeVideo = async (videoId, userId) => {

  const video = await Video.findById(videoId);

  if (!video) {

    throw new AppError("Video not found", 404);

  }



  // Initialize likedBy array if it doesn't exist

  if (!video.likedBy) {

    video.likedBy = [];

  }

  

  // Initialize likes if it doesn't exist

  if (typeof video.likes !== 'number') {

    video.likes = 0;

  }



  const userIndex = video.likedBy.indexOf(userId);

  if (userIndex > -1) {

    video.likedBy.splice(userIndex, 1);

    video.likes = Math.max(0, video.likes - 1);

  }



  await video.save();

  return video;

};



const getFollowingFeed = async (userId, { skip, limit, search, sortBy }) => {

  // For now, return public videos sorted by date

  // In a real app, this would show videos from users that the current user follows

  let query = { status: "public" };

  

  if (search) {

    query.$or = [

      { title: { $regex: search, $options: 'i' } },

      { description: { $regex: search, $options: 'i' } }

    ];

  }



  // Determine sort order based on sortBy parameter

  let sort = {};

  switch (sortBy) {

    case 'newest':

      sort = { createdAt: -1 };

      break;

    case 'popular':

      sort = { likes: -1, createdAt: -1 };

      break;

    case 'viewed':

      sort = { viewscount: -1, createdAt: -1 };

      break;

    case 'rated':

      sort = { avgRating: -1, createdAt: -1 };

      break;

    default:

      sort = { createdAt: -1 };

  }



  const videos = await Video.find(query)

    .sort(sort)

    .skip(skip)

    .limit(limit)

    .populate("owner", "username avatarKey")

    .lean();

  

  // Transform field names and add reviews count

  return videos.map(video => ({

    ...video,

    videoURL: video.videoURL, // Keep videoURL field name

    reviews: video.reviewCount || 0 // Use saved review count

  }));

};



const getTrendingFeed = async ({ skip, limit, search, sortBy }) => {

  let query = { status: "public" };

  

  if (search) {

    query.$or = [

      { title: { $regex: search, $options: 'i' } },

      { description: { $regex: search, $options: 'i' } }

    ];

  }



  // Determine sort order based on sortBy parameter

  let sort = {};

  switch (sortBy) {

    case 'newest':

      sort = { createdAt: -1 };

      break;

    case 'popular':

      sort = { likes: -1, createdAt: -1 };

      break;

    case 'viewed':

      sort = { viewscount: -1, createdAt: -1 };

      break;

    case 'rated':

      sort = { avgRating: -1, createdAt: -1 };

      break;

    default:

      sort = { likes: -1, createdAt: -1 };

  }



  const videos = await Video.find(query)

    .sort(sort)

    .skip(skip)

    .limit(limit)

    .populate("owner", "username avatarKey")

    .lean();



  return videos.map(video => ({

    ...video,

    videoURL: video.videoURL, // Keep videoURL field name

    reviews: video.reviewCount || 0 // Use saved review count

  }));

};



const getUserVideos = async (userId) => {

  const videos = await Video.find({ owner: userId })

    .sort({ createdAt: -1 })

    .populate("owner", "username avatarKey")

    .lean();



  return videos.map(video => ({

    ...video,

    videoURL: video.videoURL, // Keep videoURL field name

    reviews: video.reviewCount || 0 // Use saved review count

  }));

};

const getLikedVideos = async (userId) => {
  console.log('Getting liked videos for user:', userId);
  // Find videos where the user has liked them
  // The likedBy array contains user IDs who have liked the video
  const videos = await Video.find({ 
    likedBy: userId  // Find videos where userId is in the likedBy array
  })
    .sort({ createdAt: -1 })
    .populate("owner", "username avatarKey")
    .lean();

  console.log('Found liked videos:', videos.length);
  console.log('Video IDs:', videos.map(v => v._id));

  const mappedVideos = videos.map(video => ({
    ...video,
    videoURL: video.videoURL, // Keep videoURL field name
    reviews: video.reviewCount || 0,
    views: video.viewscount || 0 // Map viewscount to views for frontend
  }));

  console.log('Mapped videos:', mappedVideos.length);
  return mappedVideos;
};


module.exports = {

  createVideo,

  getPublicFeed,

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

