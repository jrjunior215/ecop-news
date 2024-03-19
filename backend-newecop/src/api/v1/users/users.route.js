import express from "express";
import { jwtAuthMiddleware } from "../../../middlewares/jwt-auth.middleware.js";
import { me } from "./users.controller.js";
import {
  updateUsername,
  getUsers,
  banOrUnbanUser,
  editBalance,
  changePassword,
  forgotPassword,
  resetPassword,
} from "./users.controller.js";
import { roleMiddleware } from "../../../middlewares/roleMiddleware.js";

const router = express.Router();

// Admin ban
router.put("/banuser", jwtAuthMiddleware, roleMiddleware(1), banOrUnbanUser);
router.put("/unbanuser", jwtAuthMiddleware, roleMiddleware(1), banOrUnbanUser);
//getdata user not get admin
router.get("/getusers", jwtAuthMiddleware, roleMiddleware(1), getUsers);
//edit balance user
router.put("/editbalance", jwtAuthMiddleware, roleMiddleware(1), editBalance);

//user
//check status login
router.get("/me", jwtAuthMiddleware, me);
//user update username
router.put("/update-username", jwtAuthMiddleware, updateUsername);
router.put("/changePassword", jwtAuthMiddleware, changePassword);
// Route ลืมรหัสผ่าน
router.post("/forgot-password", forgotPassword);
// Route รีเซ็ตรหัสผ่าน
router.post("/reset-password/:token", resetPassword);
export { router as usersRoute };
