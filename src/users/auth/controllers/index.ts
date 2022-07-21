import catchControllerAsyncs from "../../../utils/catchControllerAsyncs";
import { Request, Response, NextFunction } from "express";
import isEmail from "validator/lib/isEmail";
import User from "../../model/userModel";
import {
  sendLoginEmail,
  sendOTP,
  sendPasswordChanged,
  sendPasswordResetLink,
} from "../../../helperService/emailService";
import { generateToken } from "../../../utils/generateToken";

export const createUser = catchControllerAsyncs(
  async (req: Request, res: Response, next: NextFunction) => {
    // make sure user_name, email and password fields are passed in the req.body
    if (
      !req.body.user_name ||
      !req.body.email ||
      !req.body.password ||
      !req.body.link
    ) {
      return res.status(400).json({
        status: "fail",
        message: "Please make sure you pass all the required fields",
      });
    }
    const user_name: string = req.body.user_name.trim();
    const email: string = req.body.email.trim();
    const password: string = req.body.password;
    const role: string = "user";
    const link: string = req.body.link;
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
      role,
    });
    // save the user
    await user.save();
    // Create OTP using createOTP method
    const otp = user.createOTP();

    const message: string = `Use this code to verify your account`;
    // send OTP to user's email
    sendOTP(user_name, email, message, otp, link);

    await user.save();

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

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User with this email does not exist",
      });
    }
    // verify OTP
    const isValid = user.validateOTP(otp, user.otpToken, "accountVerify");
    // update user's verified field to true
    if (isValid) {
      const refresh_token = generateToken(user._id, "refresh");
      const access_token = generateToken(user.id, "access");
      await user.save();
      return res.status(200).json({
        status: "success",
        message: "Your email has been verified",
        data: {
          user: {
            user_name: user.user_name,
            email,
          },
          refresh_token,
          access_token,
        },
      });
    }

    return res.status(400).json({
      status: "fail",
      message: "OTP is incorrect",
    });
  }
);

export const login = catchControllerAsyncs(
  async (req: Request, res: Response, next: NextFunction) => {
    const { identifier, password }: { identifier: string; password: string } =
      req.body;
    if (!identifier) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide a username or an email",
      });
    }
    if (!password) {
      return res.status(400).json({
        status: "fail",
        message: "Password field cannot be empty",
      });
    }
    // find user with email or user_name and deleted field is false
    const user = await User.findOne({
      $or: [{ email: identifier.trim() }, { user_name: identifier.trim() }],
      deleted: false,
    }).select("+password -__v");
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User with this email or username does not exist",
      });
    }

    // Check if user is verified
    if (user.status !== "verified") {
      return res.status(400).json({
        status: "fail",
        message: "Please verify your email first",
      });
    }
    // console.log({user})

    // verify password
    const isValid = await user.validatePassword(password);

    // console.log({isValid});

    if (isValid) {
      const refresh_token = generateToken(user._id, "refresh");
      const access_token = generateToken(user._id, "access");
      res.status(200).json({
        status: "success",
        message: "User logged in successfully",
        data: {
          user: {
            user_name: user.user_name,
            email: user.email,
          },
          refresh_token,
          access_token,
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
    return res.status(400).json({
      status: "fail",
      message: "Password is incorrect",
    });
  }
);

export const resendOTP = catchControllerAsyncs(
  async (req: Request, res: Response, next: NextFunction) => {
    const email: string = req.body.email;
    const link: string = req.body.link;
    if (!email || !link) {
      return res.status(400).json({
        status: "fail",
        message: "Please make sure you pass all the required fields",
      });
    }
    // find user with email
    const user = await User.findOne({
      email,
      deleted: false,
    });

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User with this email does not exist",
      });
    }
    // Create OTP using createOTP method
    const otp = user.createOTP();

    const message: string = `Use this code to verify your account`;
    // send OTP to user's email
    sendOTP(user.user_name, email, message, otp, link);

    await user.save();

    return res.status(200).json({
      status: "success",
      message: "New OTP has been sent to your email",
    });
  }
);

export const forgotPassword = catchControllerAsyncs(
  async (req: Request, res: Response, next: NextFunction) => {
    const email: string = req.body.email;
    const link: string = req.body.link;
    if (!email || !link) {
      return res.status(400).json({
        status: "fail",
        message: "Please make sure you pass all the required fields",
      });
    }
    // find user with email
    const user = await User.findOne({
      email,
      deleted: false,
    });

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User with this email does not exist",
      });
    }
    // Create OTP using createOTP method
    const otp = user.createOTP();

    const message: string = `Click the button to reset your password`;

    await user.save();
    // send OTP to user's email
    const mailStatus = await sendPasswordResetLink(user.user_name, email, message, otp, link);
    
    console.log({mailStatus});

    return res.status(200).json({
      status: "success",
      message: "Your password reset details has been sent to your email",
    });
  }
);

export const resetPassword = catchControllerAsyncs(
  async (req: Request, res: Response, next: NextFunction) => {
    const email: string = req.body.email;
    const otp: string = req.body.otp;
    const password: string = req.body.password;
    if (!email || !otp || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Please make sure you pass all the required fields",
      });
    }
    // find user with email
    const user = await User.findOne({
      email,
      deleted: false,
    });

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User with this email does not exist",
      });
    }

    if (!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/)) {
      return res.status(400).json({
        status: "fail",
        message:
          "Password must be at least 8 characters long and contain a number, a lowercase letter and an uppercase letter",
      });
    }

    // verify OTP
    const isValid = user.validateOTP(otp, user.otpToken, "passwordReset");
    // update user's verified field to true
    if (isValid) {
      user.password = password;
      await user.save();
      res.status(200).json({
        status: "success",
        message: "Your password has been reset",
      });
      await sendPasswordChanged(
        user.user_name,
        email,
        "Enjoy the App anonymous one!"
      );
      return;
    }

    return res.status(400).json({
      status: "fail",
      message: "OTP is incorrect",
    });
  }
);

export const updatePassword = catchControllerAsyncs(
  async (req: Request, res: Response, next: NextFunction) => {
    const user_id: string = req.body.user._id;
    const password: string = req.body.password;
    if (!user_id || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Please make sure you pass all the required fields",
      });
    }
    // find user with user_id
    const user = await User.findOne({
      _id: user_id,
      deleted: false,
    });

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User with this user_id does not exist",
      });
    }

    if (!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/)) {
      return res.status(400).json({
        status: "fail",
        message:
          "Password must be at least 8 characters long and contain a number, a lowercase letter and an uppercase letter",
      });
    }

    // update user's password
    user.password = password;
    await user.save();
    res.status(200).json({
      status: "success",
      message: "Your password has been updated",
    });
    await sendPasswordChanged(
      user.user_name,
      user.email,
      "Enjoy the App anonymous one!"
    );
    return;
  }
);
