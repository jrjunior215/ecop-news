import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import crypto from "crypto";

const prisma = new PrismaClient();
export const me = async (req, res, next) => {
  try {
    const user = req.currentUser;
    const result = await prisma.user.findUnique({
      where: { id: user?.id },
      select: {
        email: true,
        id: true,
        google_id: true,
        username: true,
        role: true,
      },
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const updateUsername = async (req, res, next) => {
  try {
    const user = req.currentUser;
    const { newUsername } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: user?.id },
      data: { username: newUsername },
    });

    const result = {
      email: updatedUser.email,
      id: updatedUser.id,
      google_id: updatedUser.google_id,
      username: updatedUser.username,
      role: updatedUser.role,
    };

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const editBalance = async (req, res, next) => {
  try {
    const { userId, newBalance } = req.body;

    // Validate userId and newBalance

    // Update the user's balance
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { balance: newBalance },
    });

    // Send a success response
    res.status(200).json({ message: "Balance updated successfully" });
  } catch (error) {
    // Handle errors
    console.error("Error updating balance:", error);
    res.status(500).json({ error: "An error occurred while updating balance" });
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: 0,
      },
    });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "An error occurred while fetching users." });
  }
};

// controllers/admin.controller.js

export const banOrUnbanUser = async (req, res, next) => {
  try {
    const { userId, action } = req.body;

    if (action === "ban") {
      // Ban the user by updating is_banned to true
      await prisma.user.update({
        where: { id: userId },
        data: { is_banned: true },
      });

      res.json({ message: "User has been banned successfully." });
    } else if (action === "unban") {
      // Unban the user by updating is_banned to false
      await prisma.user.update({
        where: { id: userId },
        data: { is_banned: false },
      });

      res.json({ message: "User has been unbanned successfully." });
    } else {
      throw new Error("Invalid action.");
    }
  } catch (error) {
    console.error("Error banning/unbanning user:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing the request." });
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.currentUser.id; // Assuming you have user ID from authentication middleware

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // เพิ่มเงื่อนไขที่ตรวจสอบว่า google_id และ address ไม่เป็นค่าว่าง
    if (user.google_id || user.address) {
      throw new BadRequestError(
        "Cannot change password when google_id or address is not empty"
      );
    }

    const match = bcrypt.compareSync(currentPassword, user.password);
    if (!match) {
      throw new BadRequestError("Current password is incorrect");
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hash,
      },
    });

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const sendResetEmail = async (email, resetToken) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      auth: {
        user: "bbrmforwork@gmail.com",
        pass: "dehihafodfvnluyj",
      },
    });

    const mailOptions = {
      from: "bbrmforwork@gmail.com",
      to: email,
      subject: "Password Reset",
      html: `<p>Click <a href="http://localhost:3000/users/resetpassword/?email=${email}&token=${resetToken}">here</a> to reset your password.</p>`,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Email sending failed:", error);
  }
};

// สร้าง token สำหรับรีเซ็ตรหัสผ่าน
export const generateResetToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  return token;
};

// controllers/authController.js
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // ตรวจสอบว่ามีผู้ใช้งานที่ใช้อีเมลนี้หรือไม่
    const user = await prisma.user.findFirst({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // สร้างและส่ง token สำหรับรีเซ็ตรหัสผ่านให้กับผู้ใช้
    const resetToken = generateResetToken(); // สร้าง token ในการรีเซ็ตรหัสผ่าน
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: resetToken,
        resetTokenExpiry: new Date(Date.now() + 3600000), // ให้ token หมดอายุใน 1 ชั่วโมง
      },
    });

    // ส่งอีเมลพร้อมลิงค์รีเซ็ตรหัสผ่าน
    sendResetEmail(user.email, resetToken);

    res.status(200).json({ message: "Password reset link sent successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const resetPassword = async (req, res) => {
  const token = req.params.token;
  const newPassword = req.body.newPassword;

  // ค้นหาผู้ใช้จาก token
  const user = await prisma.user.findFirst({
    where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
  });

  if (!user) {
    return res.status(400).json({ error: "Invalid or expired token." });
  }

  // เข้ารหัสรหัสผ่านใหม่ก่อนบันทึกลงฐานข้อมูล
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(newPassword, salt);

  // อัพเดทรหัสผ่านและลบ token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hash,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  res.status(200).json({ message: "Password reset successfully." });
};
