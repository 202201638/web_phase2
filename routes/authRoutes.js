const express = require("express");

const authController = require("../controllers/authController");
const validate = require("../middleware/validate");
const { registerSchema, loginSchema } = require("../validators/authValidators");

const router = express.Router();

router.post("/register", validate({ bodySchema: registerSchema }), authController.register);
router.post("/login", validate({ bodySchema: loginSchema }), authController.login);
router.post("/logout", authController.logout);

module.exports = router;
