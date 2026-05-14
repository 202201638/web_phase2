const express = require("express");

const morgan = require("morgan");

const mongoSanitize = require("express-mongo-sanitize");

const cors = require("cors");

const swaggerUi = require("swagger-ui-express");

const fs = require("fs");

const path = require("path");

const { 
  helmetConfig, 
  corsConfig, 
  apiLimiter, 
  authLimiter, 
  uploadLimiter, 
  paymentLimiter, 
  interactionLimiter 
} = require("./middleware/security");

const swaggerSpec = require("./config/swagger");

const { initMinIO } = require("./config/minio");

const notFound = require("./middleware/notFound");

const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");

const userRoutes = require("./routes/userRoutes");

const videoRoutes = require("./routes/videoRoutes");

const adminRoutes = require("./routes/adminRoutes");

const stripeRoutes = require("./routes/stripeRoutes");



const app = express();

app.set("etag", false);



// Initialize MinIO on app startup

initMinIO().catch((error) => {

  console.error("Warning: MinIO initialization failed:", error.message);

});



app.use(morgan("dev"));

// Security middleware
app.use(helmetConfig);
app.use(corsConfig);

// Rate limiting
app.use(apiLimiter);

// Body parser middleware (skip multipart/form-data - multer handles that)
app.use((req, res, next) => {
  if (req.is('multipart/form-data')) {
    return next();
  }
  express.json({ limit: '10mb' })(req, res, next);
});

app.use((req, res, next) => {
  if (req.is('multipart/form-data')) {
    return next();
  }
  express.urlencoded({ extended: true, limit: '10mb' })(req, res, next);
});

app.use(mongoSanitize());



// Serve static files from uploads directory with proper MIME types and range request support

app.use('/uploads', (req, res, next) => {

  // Set CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Handle range requests for video streaming

  if (req.method === 'GET' && req.headers.range) {

    const filePath = path.join(__dirname, 'uploads', req.path.replace(/^\//, ''));

    

    if (fs.existsSync(filePath)) {

      const stat = fs.statSync(filePath);

      const fileSize = stat.size;

      const range = req.headers.range;

      

      if (range) {

        const parts = range.replace(/bytes=/, "").split("-");

        const start = parseInt(parts[0], 10);

        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        const chunksize = (end - start) + 1;

        const file = fs.createReadStream(filePath, { start, end });

        

        const head = {

          'Content-Range': `bytes ${start}-${end}/${fileSize}`,

          'Accept-Ranges': 'bytes',

          'Content-Length': chunksize,

          'Content-Type': 'video/mp4',

          'Access-Control-Allow-Origin': '*',

          'Access-Control-Allow-Methods': 'GET',

          'Access-Control-Allow-Headers': 'Range, Content-Type',

          'Cross-Origin-Resource-Policy': 'cross-origin',

        };

        

        res.writeHead(206, head);

        file.pipe(res);

        return;

      }

    }

  }

  

  // Fall back to static serving for non-range requests

  express.static('uploads', {

    setHeaders: (res, path) => {

      if (path.endsWith('.mp4')) {

        res.setHeader('Content-Type', 'video/mp4');

      } else if (path.endsWith('.webm')) {

        res.setHeader('Content-Type', 'video/webm');

      } else if (path.endsWith('.ogg')) {

        res.setHeader('Content-Type', 'video/ogg');

      } else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {

        res.setHeader('Content-Type', 'image/jpeg');

      } else if (path.endsWith('.png')) {

        res.setHeader('Content-Type', 'image/png');

      }

      res.setHeader('Access-Control-Allow-Origin', '*');

      res.setHeader('Access-Control-Allow-Methods', 'GET');

      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');

      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

      res.setHeader('Accept-Ranges', 'bytes');

    }

  })(req, res, next);

});



app.get("/", (_req, res) => {

  res.status(200).json({

    message: "Welcome to ClipSphere API",

    version: "1.0.0",

    endpoints: {

      health: "/health",

      documentation: "/api-docs",

      auth: "/api/v1/auth",

      users: "/api/v1/users",

      videos: "/api/v1/videos",

      admin: "/api/v1/admin"

    },

    timestamp: new Date().toISOString(),

  });

});



app.get("/health", (_req, res) => {

  res.status(200).json({

    status: "ok",

    service: "ClipSphere API",

    timestamp: new Date().toISOString(),

  });

});



app.use("/api-docs", (req, res, next) => {

  res.set("Cache-Control", "no-store");

  next();

});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/v1/auth", authLimiter, authRoutes);

app.use("/api/v1/users", userRoutes);

app.use("/api/v1/videos", videoRoutes);

app.use("/api/v1/admin", adminRoutes);

app.use("/api/v1/stripe", paymentLimiter, stripeRoutes);

// Multer error handler
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: { message: 'File size too large. Maximum size is 500MB.' }
    });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      error: { message: 'Unexpected file field. Expected "file".' }
    });
  }
  next(err);
});

app.use(notFound);

app.use(errorHandler);



module.exports = app;

