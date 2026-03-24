const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "ClipSphere API",
      version: "1.0.0",
      description: "Phase 1 foundational backend API documentation",
    },
    servers: [
      {
        url: "http://localhost:{port}",
        variables: {
          port: {
            default: "3000",
          },
        },
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        NotificationPreferences: {
          type: "object",
          properties: {
            inApp: {
              type: "object",
              properties: {
                followers: { type: "boolean" },
                comments: { type: "boolean" },
                likes: { type: "boolean" },
                tips: { type: "boolean" },
              },
            },
            email: {
              type: "object",
              properties: {
                followers: { type: "boolean" },
                comments: { type: "boolean" },
                likes: { type: "boolean" },
                tips: { type: "boolean" },
              },
            },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            username: { type: "string" },
            email: { type: "string", format: "email" },
            role: { type: "string", enum: ["user", "admin"] },
            bio: { type: "string" },
            avatarKey: { type: "string" },
            active: { type: "boolean" },
            accountstatus: { type: "string" },
            notificationPreferences: {
              $ref: "#/components/schemas/NotificationPreferences",
            },
          },
        },
        Video: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            owner: { type: "string" },
            videoURL: { type: "string" },
            duration: { type: "number" },
            timestamps: { type: "array", items: { type: "number" } },
            viewscount: { type: "number" },
            status: { type: "string", enum: ["public", "private", "flagged"] },
          },
        },
        Review: {
          type: "object",
          properties: {
            id: { type: "string" },
            rating: { type: "number", minimum: 1, maximum: 5 },
            comment: { type: "string" },
            user: { type: "string" },
            video: { type: "string" },
          },
        },
      },
    },
    paths: {
      "/health": { get: { tags: ["System"], summary: "Basic server heartbeat" } },
      "/api/v1/admin/health": {
        get: {
          tags: ["Admin"],
          summary: "Detailed health (uptime and DB status)",
          security: [{ bearerAuth: [] }],
        },
      },
      "/api/v1/auth/register": {
        post: { tags: ["Auth"], summary: "Register user account" },
      },
      "/api/v1/auth/login": {
        post: { tags: ["Auth"], summary: "Login and receive JWT token" },
      },
      "/api/v1/users/me": {
        get: {
          tags: ["Users"],
          summary: "Get logged-in user profile",
          security: [{ bearerAuth: [] }],
        },
      },
      "/api/v1/users/updateMe": {
        patch: {
          tags: ["Users"],
          summary: "Update own profile metadata",
          security: [{ bearerAuth: [] }],
        },
      },
      "/api/v1/users/{id}": {
        get: {
          tags: ["Users"],
          summary: "Get public user profile",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
        },
      },
      "/api/v1/users/preferences": {
        patch: {
          tags: ["Users"],
          summary: "Update notification preferences",
          security: [{ bearerAuth: [] }],
        },
      },
      "/api/v1/users/{id}/follow": {
        post: {
          tags: ["Social Graph"],
          summary: "Follow user",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
        },
      },
      "/api/v1/users/{id}/unfollow": {
        delete: {
          tags: ["Social Graph"],
          summary: "Unfollow user",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
        },
      },
      "/api/v1/users/{id}/followers": {
        get: {
          tags: ["Social Graph"],
          summary: "List followers",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
        },
      },
      "/api/v1/users/{id}/following": {
        get: {
          tags: ["Social Graph"],
          summary: "List following",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
        },
      },
      "/api/v1/videos": {
        post: {
          tags: ["Videos"],
          summary: "Create video metadata",
          security: [{ bearerAuth: [] }],
        },
        get: {
          tags: ["Videos"],
          summary: "Get public video feed",
        },
      },
      "/api/v1/videos/{id}": {
        patch: {
          tags: ["Videos"],
          summary: "Update video metadata",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
        },
        delete: {
          tags: ["Videos"],
          summary: "Delete video",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
        },
      },
      "/api/v1/videos/{id}/reviews": {
        post: {
          tags: ["Reviews"],
          summary: "Submit a review for a video",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
        },
      },
      "/api/v1/admin/stats": {
        get: {
          tags: ["Admin"],
          summary: "Get platform stats",
          security: [{ bearerAuth: [] }],
        },
      },
      "/api/v1/admin/users/{id}/status": {
        patch: {
          tags: ["Admin"],
          summary: "Soft delete user account",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
        },
      },
      "/api/v1/admin/moderation": {
        get: {
          tags: ["Admin"],
          summary: "Get flagged or low-rated content",
          security: [{ bearerAuth: [] }],
        },
      },
    },
  },
  apis: [],
};

module.exports = swaggerJSDoc(options);
