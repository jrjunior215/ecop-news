import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
const prisma = new PrismaClient();
import bcrypt from "bcryptjs";
import config from "../../../config/index.js";
import { BadRequestException } from "../../../exceptions/bad-request.exception.js";
import { NotAuthorizeRequestException } from "../../../exceptions/not-authorize-request.exception.js";

export const googleAuth = async (req, res, next) => {
  try {
    const { id, emails, photos, displayName } = req.user;

    const existingAccount = await prisma.user.findFirst({
      where: { google_id: id },
    });
    if (!existingAccount && emails && emails.length > 0) {
      const existingEmail = await prisma.user.findFirst({
        where: { email: emails[0].value },
      });
      if (existingEmail) {
        console.log("error case");
        res.redirect(
          `${process.env.FRONTEND_URL}/signin?error=${encodeURIComponent(
            "Incorrect_Email"
          )}`
        );
        return;
      } else {
        const created = await prisma.user.create({
          data: {
            username: displayName,
            email: emails[0].value,
            google_id: id,
            is_verified: true,
          },
        });
        const userJwt = jwt.sign(
          {
            id: created.id,
            email: created.email,
            role: created.role,
            is_banned: created.is_banned,
          },
          config.jwtSecretKey
        );

        req.session = {
          jwt: userJwt,
        };
        res.redirect(`${process.env.FRONTEND_URL}/users`);
        //save and create account
        return;
      }
    }

    if (existingAccount) {
      const userJwt = jwt.sign(
        {
          id: existingAccount.id,
          // email: existingAccount.email,
          role: existingAccount.role,
          is_banned: existingAccount.is_banned,
        },
        config.jwtSecretKey
      );

      req.session = {
        jwt: userJwt,
      };

      if (existingAccount.is_banned) {
        return res.redirect(`${process.env.FRONTEND_URL}/suspended`);
      }

      if (existingAccount.role === 1) {
        res.redirect(`${process.env.FRONTEND_URL}/admin`);
      } else {
        res.redirect(`${process.env.FRONTEND_URL}/users`);
      }
      return;
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const signout = async (req, res, next) => {
  try {
    req.session = null;
    res.json({});
  } catch (error) {
    console.log(error);
    next(error);
  }
};
