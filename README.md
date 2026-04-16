# ClipSphere - Full Stack Video Sharing Platform

**Phase 1**: Express + MongoDB backend (API)
**Phase 2**: Next.js frontend (UI) + MinIO storage + Local infrastructure ✅ (COMPLETED)

---

## 🚀 Phase 2 - Next.js Integration & Local Media Pipeline

### ✅ New Components Implemented

**Next.js Frontend** (`localhost:3000`)
- Responsive design with Tailwind CSS
- Mobile-first grid (1 col / 2 tablet / 3-4 desktop)
- Protected routes with JWT middleware
- Authentication with useAuth hook and context provider

**Local MinIO S3 Storage**
- Docker-based object storage service
- Presigned URL generation for secure access
- Video file management and isolation

**Media Validation Pipeline**
- FFmpeg integration for duration validation (max 300 seconds)
- Multer file validation (type, size)
- Atomic database updates to prevent orphaned records

**Key Features Implemented**
- ✅ User authentication (register, login, token management)
- ✅ Video upload with progress tracking
- ✅ Infinite scroll discovery (Intersection Observer API)
- ✅ Like/Unlike system with real-time updates
- ✅ Star-rating review system with comments
- ✅ Responsive video player (React Player)
- ✅ Admin dashboard with statistics
- ✅ Notification preferences management
- ✅ Email notifications (Nodemailer integration)
- ✅ Separate feeds: Discover, Trending, Following

### 📋 Quick Setup (5 Minutes)

```bash
# 1. Backend dependencies
cd d:\web\Web
npm install

# 2. Frontend dependencies
cd frontend
npm install

# 3. Start Docker (MongoDB + MinIO)
cd ..
docker-compose up -d

# 4. Terminal 1: Backend (port 5000)
npm run dev

# 5. Terminal 2: Frontend (port 3000)
cd frontend && npm run dev
```

### 🔗 Access Points

- **App**: http://localhost:3000
- **API**: http://localhost:5000/api-docs
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)
- **Health Check**: http://localhost:5000/health

---

## 📖 Detailed Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Complete Phase 2 guide with feature overview
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - In-depth setup, architecture, and troubleshooting

---

## Phase 1 - Backend Setup

### Prerequisites

- Node.js 18+ (recommended: latest LTS)
- MongoDB running locally or via Docker
- FFmpeg installed (for video validation)

### Backend Installation

```bash
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

Configure `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/clipsphere
JWT_SECRET=your_secure_secret_key_here

# MinIO S3 Storage (Phase 2)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=clipsphere-videos
MINIO_USE_SSL=false

# Email Notifications (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

### Verify API

- Health: `GET http://localhost:5000/health`
- Docs: `http://localhost:5000/api-docs`

### Seed Database

```bash
npm run seed
```

Creates test data:
- 1 admin user
- 3 standard users
- 6 sample videos
- Reviews and follower relationships

---

## 📚 API Endpoints Overview

### Authentication
- `POST /api/v1/auth/register` - Create account
- `POST /api/v1/auth/login` - Get JWT token

### Videos
- `GET /api/v1/videos` - List public videos (paginated)
- `POST /api/v1/videos` - Upload video
- `PATCH /api/v1/videos/:id` - Edit video (owner)
- `DELETE /api/v1/videos/:id` - Delete video (owner)
- `POST /api/v1/videos/:id/like` - Like video
- `DELETE /api/v1/videos/:id/like` - Unlike video
- `POST /api/v1/videos/:id/reviews` - Add review

### Feeds
- `GET /api/v1/videos/feed/following` - Following videos
- `GET /api/v1/videos/feed/trending` - Trending videos

### Users
- `GET /api/v1/users/me` - Current user profile
- `PATCH /api/v1/users/me` - Update profile
- `POST /api/v1/users/:id/follow` - Follow user
- `DELETE /api/v1/users/:id/follow` - Unfollow user

### Admin
- `GET /api/v1/admin/stats` - System statistics
- `GET /health` - System health

---

## 🗂️ Project Structure

```
d:\web\Web\
├── frontend/                          # Next.js React app (port 3000)
│   ├── app/
│   │   ├── page.tsx                   # Homepage
│   │   ├── discover/page.tsx          # Video discovery
│   │   ├── trending/page.tsx          # Trending videos
│   │   ├── following/page.tsx         # Following feed
│   │   ├── video/[id]/page.tsx        # Video player
│   │   ├── upload/page.tsx            # Upload form
│   │   ├── settings/page.tsx          # User settings
│   │   ├── admin/page.tsx             # Admin dashboard
│   │   ├── auth/login/page.tsx        # Login
│   │   ├── auth/register/page.tsx     # Register
│   │   ├── layout.tsx                 # Root layout
│   │   ├── providers.tsx              # Auth provider
│   │   └── providers/AuthProvider.tsx # Auth context
│   ├── components/
│   │   ├── layout/Navbar.tsx          # Navigation
│   │   └── video/
│   │       ├── VideoCard.tsx          # Grid card
│   │       ├── ReviewForm.tsx         # Review input
│   │       └── ReviewList.tsx         # Reviews display
│   ├── lib/
│   │   ├── hooks/useAuth.ts           # Auth hook
│   │   └── services/api.ts            # API client
│   ├── middleware.ts                  # Route protection
│   └── package.json
│
├── config/
│   ├── minio.js                       # S3 client setup
│   ├── db.js                          # MongoDB connection
│   └── swagger.js                     # API documentation
│
├── middleware/
│   ├── upload.js                      # Multer + FFmpeg
│   ├── auth.js                        # JWT verification
│   ├── errorHandler.js                # Error handling
│   └── ownership.js                   # Owner checks
│
├── services/
│   ├── emailService.js                # Nodemailer
│   ├── videoService.js                # Business logic
│   ├── authService.js                 # Auth logic
│   └── userService.js                 # User logic
│
├── routes/                            # API endpoints
├── models/                            # MongoDB schemas
├── controllers/                       # Route handlers
├── validators/                        # Zod validation
│
├── docker-compose.yml                 # Docker services
├── .env.example                       # Env template
├── package.json                       # Dependencies
├── QUICK_START.md                     # Phase 2 guide
├── SETUP_GUIDE.md                     # Full guide
└── README.md                          # This file
```

---

## 🧪 Testing Workflow

### 1. Test Registration
Visit: http://localhost:3000/auth/register
- Create account with email and password
- Should redirect to discovery page

### 2. Test Video Upload
Visit: http://localhost:3000/upload
- Select video file (< 5 minutes, < 500MB)
- Enter title and description
- Click upload and watch progress

### 3. Test Discovery
Visit: http://localhost:3000/discover
- Scroll down to trigger infinite scroll
- Videos load automatically

### 4. Test Interactions
Click on any video:
- Play video with controls
- Like/unlike video
- Submit star rating and comment

### 5. Test Admin
Create admin user (or modify existing via MongoDB)
- Visit: http://localhost:3000/admin
- View system statistics

---

## 🔒 Security Features

✅ JWT token validation on protected routes
✅ Presigned URLs for secure video access
✅ Owner verification for edit/delete operations
✅ Password hashing with bcrypt
✅ Request validation with Zod
✅ MongoDB injection prevention
✅ CORS configuration for frontend

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| `ECONNREFUSED :9000` | Run `docker-compose up -d` |
| `FFmpeg not found` | Install FFmpeg or add to PATH |
| `401 Unauthorized` | Check token in browser cookies |
| `CORS Error` | Verify API_URL in `.env.local` |
| `Connection refused DB` | Start Docker MongoDB |
| `Video too long` | Upload video < 300 seconds |

---

## 📞 Support Resources

- **API Docs**: http://localhost:5000/api-docs
- **Next.js Docs**: https://nextjs.org/docs
- **MongoDB Docs**: https://docs.mongodb.com
- **MinIO Docs**: https://docs.min.io

---

## ✨ Technology Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Backend | Express.js, Node.js |
| Database | MongoDB |
| Storage | MinIO (S3-compatible) |
| Video Processing | FFmpeg |
| Email | Nodemailer |
| Authentication | JWT + HTTP Cookies |
| HTTP Client | Axios |
| Video Player | React Player |
| State Management | React Context + Zustand |

---

## 📝 Course Information

Course: Web Development (SWAPD352)
Instructor: Dr. Mohamed Sami Rakha
Term: Spring 2026
Level: Intermediate-Advanced

---

## 📄 License

ISC
