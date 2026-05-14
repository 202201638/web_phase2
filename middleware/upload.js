const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");

// Configure multer for file upload
const uploadDir = path.join(__dirname, "../uploads");

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "video-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  console.log("File received:", file.mimetype, file.originalname, file.size);
  
  // Only accept MP4 files for maximum compatibility
  if (file.mimetype !== 'video/mp4') {
    return cb(
      new Error(`Invalid file type. Only MP4 video files are allowed. Got: ${file.mimetype}`)
    );
  }
  
  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== '.mp4') {
    return cb(
      new Error(`Invalid file extension. Only .mp4 files are allowed. Got: ${ext}`)
    );
  }
  
  // Remove minimum file size check for testing
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB
    fieldSize: 500 * 1024 * 1024, // 500 MB for fields
  },
});

/**
 * Get video duration using FFmpeg
 */
const getVideoDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        return reject(new Error(`Failed to probe video: ${err.message}`));
      }

      const duration = metadata.format.duration;
      resolve(Math.ceil(duration)); // Return duration in seconds, rounded up
    });
  });
};

/**
 * Validate video duration (max 300 seconds / 5 minutes)
 */
const validateVideoDuration = async (filePath, maxDuration = 300) => {
  try {
    const duration = await getVideoDuration(filePath);

    if (duration > maxDuration) {
      throw new Error(
        `Video duration ${duration}s exceeds maximum allowed duration of ${maxDuration}s (5 minutes)`
      );
    }

    return { valid: true, duration };
  } catch (error) {
    throw error;
  }
};

/**
 * Generate thumbnail from video using FFmpeg
 */
const generateThumbnail = (videoPath) => {
  return new Promise((resolve, reject) => {
    const thumbnailPath = videoPath.replace(/\.[^/.]+$/, '_thumbnail.jpg');
    
    ffmpeg(videoPath)
      .screenshots({
        timestamps: ['00:00:02'], // Take screenshot at 2 seconds (better for intros)
        filename: path.basename(thumbnailPath),
        folder: path.dirname(thumbnailPath),
        size: '640x360' // Higher resolution for better quality
      })
      .on('end', () => {
        resolve(`/uploads/${path.basename(thumbnailPath)}`);
      })
      .on('error', (err) => {
        console.error('Error generating thumbnail:', err);
        reject(err);
      });
  });
};

/**
 * Clean up uploaded file
 */
const cleanupFile = (filePath) => {
  return new Promise((resolve) => {
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Error deleting file ${filePath}:`, err.message);
        }
        resolve();
      });
    } else {
      resolve();
    }
  });
};

module.exports = {
  upload,
  getVideoDuration,
  validateVideoDuration,
  generateThumbnail,
  cleanupFile,
};
