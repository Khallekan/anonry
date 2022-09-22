import { Request, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import passport from "passport";
import { sendLoginEmail } from "../../helperService/emailService";
import userModel from "../../users/model/userModel";
import catchController from "../../utils/catchControllerAsyncs";
import generateToken from "../../utils/generateToken";
import verifyToken from "../../utils/verifyToken";
import {
  createUser,
  // createUserGoogle,
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

router.route("/google").get(passport.authenticate("google"));

router.route("/google/success").get(
  catchController(async (req: Request, res: Response) => {
    console.log("HIT");
    console.log({ user: req.user });

    if (req.user) {
      const user = await userModel
        .findOne({
          $or: [{ email: req.user.email }, { user_name: req.user.user_name }],
          deleted: false,
        })
        .select("+password -__v +status");
      console.log({ user });

      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
          data: {
            status: StatusCodes.NOT_FOUND,
            message: "User with this email or username does not exist",
          },
        });
      }

      // Check if user is verified
      if (user.status !== "verified") {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          data: {
            status: StatusCodes.UNAUTHORIZED,
            message: "Please verify your email first",
          },
        });
      }
      const { token: refresh_token, token_expires: refresh_token_expires } =
        generateToken(user._id, "refresh");
      const { token: access_token, token_expires: access_token_expires } =
        generateToken(user.id, "access");
      res.status(StatusCodes.OK).json({
        data: {
          status: StatusCodes.OK,
          message: "User logged in successfully",
          data: {
            user: {
              user_name: user.user_name,
              email: user.email,
            },
            refresh_token,
            access_token,
            refresh_token_expires,
            access_token_expires,
          },
        },
      });
      // Get date with time in day/month/year 24hr clock
      const date = new Date();
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const hour = date.getHours();
      const minute = date.getMinutes();
      const second = date.getSeconds();
      const time = `${day}/${month}/${year} ${hour}:${minute}:${second}`;
      // get timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const message = `Please be informed that your anonry account has been accessed on - ${time} ${timezone}`;
      await sendLoginEmail(user.user_name, user.email, message);
      return;
    }
    return res.status(401).json({ message: "Error" });
  })
);

router.get("/google/fail", (req, res) => {
  res
    .status(401)
    .json({ success: false, message: "Google authentication failed" });
});

router.route("/google/callback").get(
  passport.authenticate("google", {
    successRedirect: "http://localhost:3000/",
    failureRedirect: "/users/auth/google/fail",
  }),
  // createUserGoogle
);

// router.route("/google").get(passport.authenticate("google"), createUser);

router.route("/verify").post(verifyEmail);

router.route("/refresh-token").post(getAccessToken);

router.route("/resend-otp").post(resendOTP);

router.route("/forgot-password").post(forgotPassword);

router.route("/reset-password").post(resetPassword);

router.route("/update-password").post(verifyToken, updatePassword);

export default router;
