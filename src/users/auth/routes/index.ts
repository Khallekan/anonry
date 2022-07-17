import { Router } from "express";
import verifyToken from "../../../utils/verifyToken";
import {
  createUser,
  forgotPassword,
  login,
  resendOTP,
  resetPassword,
  updatePassword,
  verifyEmail,
} from "../controllers";

const router = Router();

router.route("/").post(login);

router.route("/signup").post(createUser);

router.route("/verify").post(verifyEmail);

router.route("/resend-otp").post(resendOTP);

router.route("/forgot-password").post(forgotPassword);

router.route("/reset-password").post(resetPassword);

router.route("/update-password").post(verifyToken, updatePassword);

export default router;
