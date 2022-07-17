import catchControllerAsyncs from "../../../utils/catchControllerAsyncs";
import { Request, Response, NextFunction } from "express";
import isEmail from "validator/lib/isEmail";
import User from "../../model/userModel";
import { sendOTP } from "../../../helperService/emailService";

export const createUser = catchControllerAsyncs(
  async (req: Request, res: Response, next: NextFunction) => {
    // make sure user_name, email and password fields are passed in the req.body
    if (!req.body.user_name || !req.body.email || !req.body.password) {
      return res.status(400).json({
        status: "fail",
        message: "Please make sure you pass all the required fields",
      });
    }
    const user_name: string = req.body.user_name.trim();
    const email: string = req.body.email.trim();
    const password: string = req.body.password;
    // make sure password is at least 8 characters long and contains a number a lowercase letter and an uppercase letter
    if (!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/)) {
      return res.status(400).json({
        status: "fail",
        message:
          "Password must be at least 8 characters long and contain a number, a lowercase letter and an uppercase letter",
      });
    }
    // make sure user_name is at least 5 characters long
    if (user_name.length < 5) {
      return res.status(400).json({
        status: "fail",
        message: "User name must be at least 5 characters long",
      });
    }
    // make sure email is valid
    if (!isEmail(email)) {
      return res.status(400).json({
        status: "fail",
        message: "Please make sure you pass a valid email",
      });
    }

    // make sure user_name is unique
    if (email) {
      const existingUserEmail = await User.findOne({
        email,
      });
      if (existingUserEmail) {
        return res.status(409).json({
          status: "fail",
          message: `User with email: ${email} already exists`,
        });
      }
    }

    // make email is unique
    if (req.body.user_name) {
      const existingUserName = await User.findOne({
        user_name,
      });
      if (existingUserName) {
        return res.status(409).json({
          status: "fail",
          message: `User with user name: ${user_name} already exists`,
        });
      }
    }
    // create a new user
    const user = new User({
      user_name,
      email,
      password,
    });
    // save the user
    await user.save();
    // Create OTP using createOTP method
    const otp = user.createOTP();
    console.log(typeof otp, "THIS IS THE TYPE OF OTPPP");

    const message: string = `Use this code to verify your account`;
    // send OTP to user's email
    sendOTP(user_name, email, message, otp);

    return res.status(201).json({
      status: "success",
      message: "OTP has been sent to your email",
    });
  }
);

export const verifyEmail = catchControllerAsyncs(
  async (req: Request, res: Response, next: NextFunction) => {
    const email: string = req.body.email;
    const otp: string = req.body.otp;
    if (!email || !otp) {
      return res.status(400).json({
        status: "fail",
        message: "Please make sure you pass all the required fields",
      });
    }
    // find user with email
    const user = await User.findOne({
      email,
    });
    console.log(user);
    
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User with this email does not exist",
      });
    }
    // verify OTP
    const isValid = user.validateOTP(otp, user.otpToken, "verifyToken");
    // update user's verified field to true
    if (isValid) {
      return res.status(200).json({
        status: "success",
        message: "Your email has been verified",
      });
    }

    return res.status(400).json({
      status: "fail",
      message: "OTP is incorrect",
    });
  }
);
