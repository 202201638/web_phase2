const bcrypt = require("bcrypt");

const User = require("../models/User");
const AppError = require("../utils/AppError");
const { signToken } = require("../utils/jwt");

const SALT_ROUNDS = 10;

const sanitizeUser = (userDoc) => ({
  id: userDoc._id,
  username: userDoc.username,
  email: userDoc.email,
  role: userDoc.role,
  bio: userDoc.bio,
  avatarKey: userDoc.avatarKey,
  active: userDoc.active,
  accountstatus: userDoc.accountstatus,
  notificationPreferences: userDoc.notificationPreferences,
});

const register = async ({ username, email, password }) => {
  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    throw new AppError("Username or email already in use", 409);
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({
    username,
    email,
    hashedPassword,
  });

  const token = signToken({ id: user._id, role: user.role });
  return { token, user: sanitizeUser(user) };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+hashedPassword");
  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.hashedPassword);
  if (!passwordMatches) {
    throw new AppError("Invalid credentials", 401);
  }

  if (!user.active) {
    throw new AppError("Account is inactive", 403);
  }

  const token = signToken({ id: user._id, role: user.role });
  return { token, user: sanitizeUser(user) };
};

module.exports = { register, login };
