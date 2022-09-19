import { Router } from "express";
import passport from "passport";
import verifyToken from "../../utils/verifyToken";
import {
  createUser,
  createUserGoogle,
  forgotPassword,
  getAccessToken,
  login,
  resendOTP,
  resetPassword,
  updatePassword,
  verifyEmail,
} from "../controllers";

import("../strategies/google");

const router = Router();

router.route("/").post(login);

router.route("/signup").post(createUser);

router
  .route("/signup/google")
  .get(passport.authenticate("google", { session: false }));

router
  .route("/signup/google/callback")
  .get(passport.authenticate("google", { session: false }), createUserGoogle);

// router.route("/google").get(passport.authenticate("google"), createUser);

router.route("/verify").post(verifyEmail);

router.route("/refresh-token").post(getAccessToken);

router.route("/resend-otp").post(resendOTP);

router.route("/forgot-password").post(forgotPassword);

router.route("/reset-password").post(resetPassword);

router.route("/update-password").post(verifyToken, updatePassword);

export default router;
