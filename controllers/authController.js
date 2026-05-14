const authService = require("../services/authService");
const asyncHandler = require("../middleware/asyncHandler");

/** @description Cookie options for JWT token */
const COOKIE_OPTIONS = {
  httpOnly: false,       // Frontend reads via js-cookie, keep accessible
  secure: false,         // Set to true in production (HTTPS)
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
};

/**
 * @description Register a new user and return JWT token
 * @route POST /api/v1/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);

  // Return token in response body - frontend will handle cookie storage
  res.status(201).json({
    success: true,
    data: result,
  });
});

/**
 * @description Login a user and return JWT token
 * @route POST /api/v1/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);

  // Return token in response body - frontend will handle cookie storage
  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * @description Logout the current user by clearing the JWT cookie
 * @route POST /api/v1/auth/logout
 */
const logout = asyncHandler(async (_req, res) => {
  // Clear the JWT cookie by setting it to empty with maxAge: 0
  res.cookie("token", "", {
    httpOnly: false,
    secure: false,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

module.exports = { register, login, logout };
