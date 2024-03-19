import express from "express";
import { googleAuth, signout } from "./auth.controller.js";
import { validateRequestMiddleware } from "../../../middlewares/validate-request.middleware.js";
import {
  SigninMetamaskSchema,
  SigninSchema,
  SignupSchema,
} from "./auth.schema.js";
import passport from "passport";
const router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.BACKEND_URL}`,
  }),
  googleAuth
);

router.post("/signout", signout);

export { router as authRoute };
