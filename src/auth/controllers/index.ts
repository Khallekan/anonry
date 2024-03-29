import axios from 'axios';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import isEmail from 'validator/lib/isEmail';

import {
  sendLoginEmail,
  sendOTP,
  sendPasswordChanged,
  sendPasswordResetLink,
} from '../../helperService/emailService';
import User from '../../users/model/userModel';
import catchController from '../../utils/catchControllerAsyncs';
import generateToken from '../../utils/generateToken';
import { rand } from '../../utils/randomNumber';
import ResponseStatus from '../../utils/response';

const resp = new ResponseStatus();

const passRequredFieldsMessage =
  'Please make sure you pass all the required fields';
const passwordRegexMessage =
  'Password must be at least 8 characters long and contain a number, a lowercase letter and an uppercase letter';
const userNotFoundMessage = 'User with this email does not exist';

export const createUser = catchController(
  async (req: Request, res: Response) => {
    // make sure user_name, email and password fields are passed in the req.body
    if (
      !req.body.user_name ||
      !req.body.email ||
      !req.body.password ||
      !req.body.link
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        data: {
          status: StatusCodes.BAD_REQUEST,
          message: passRequredFieldsMessage,
        },
      });
    }
    const user_name: string = req.body.user_name.trim();

    // if user_name has spaces return error
    if (user_name.includes(' ')) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        data: {
          status: StatusCodes.BAD_REQUEST,
          message: 'Please make sure username does not contain spaces',
        },
      });
    }

    const email: string = req.body.email.trim();
    const password: string = req.body.password;
    const role = 'user';
    // generate a random whole number between 1 and 4 icluding 1 and 4
    const randomNumber = Math.floor(Math.random() * (4 - 1 + 1)) + 1;
    const avatar = `https://robohash.org/${user_name}?set=${randomNumber}&size=500x500`;
    const link: string = req.body.link;
    // make sure password is at least 8 characters long and contains a number a lowercase letter and an uppercase letter
    // regex for password validation - at least 8 characters long and has at least one lowercase letter, at least one uppercase letter and at least one number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/;

    if (!password.match(passwordRegex)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        data: {
          status: StatusCodes.BAD_REQUEST,
          message: passwordRegexMessage,
        },
      });
    }
    // make sure user_name is at least 5 characters long
    if (user_name.length < 3) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        data: {
          status: StatusCodes.BAD_REQUEST,
          message: 'User name must be at least 3 characters long',
        },
      });
    }
    // make sure email is valid
    if (!isEmail(email)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        data: {
          status: StatusCodes.BAD_REQUEST,
          message: 'Please make sure you pass a valid email',
        },
      });
    }

    // make sure user_name is unique
    if (email) {
      const existingUserEmail = await User.findOne({
        email: { $regex: email, $options: 'i' },
      });
      if (existingUserEmail) {
        return res.status(StatusCodes.CONFLICT).json({
          data: {
            status: StatusCodes.CONFLICT,
            message: `User with email: ${email} already exists`,
          },
        });
      }
    }

    // make email is unique
    if (req.body.user_name) {
      const existingUserName = await User.findOne({
        user_name: { $regex: user_name, $options: 'i' },
      });
      if (existingUserName) {
        return res.status(StatusCodes.CONFLICT).json({
          data: {
            status: StatusCodes.CONFLICT,
            message: `User with user name: ${user_name} already exists`,
          },
        });
      }
    }
    // create a new user
    const user = new User({
      user_name,
      email,
      password,
      role,
      avatar,
    });

    // save the user
    await user.save();
    // Create OTP using createOTP method
    const otp = user.createOTP();

    const message = `Use this code to verify your account`;
    // send OTP to user's email
    await sendOTP(user_name, email, message, otp, link);
    // await nodemailer.createTestAccount()

    await user.save();

    return res.status(StatusCodes.CREATED).json({
      data: {
        status: StatusCodes.CREATED,
        message: 'OTP has been sent to your email',
      },
    });
  }
);

export const createUserGoogle = catchController(
  async (req: Request, res: Response) => {
    const { token }: { token: string | undefined } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(StatusCodes.FORBIDDEN).json({
        data: {
          status: StatusCodes.FORBIDDEN,
          message: 'Invalid token or token missing',
          data: null,
        },
      });
    }

    const {
      data: googleInfo,
    }: {
      data: {
        id: string;
        email: string;
        verified_email: boolean;
        name: string;
        given_name: string;
        family_name: string;
        picture: string;
        locale: string;
      };
    } = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const user = await User.findOne({
      $and: [{ 'google.id': googleInfo.id }, { email: googleInfo.email }],
    });

    console.log({ location: 'CHECKING IF USER EXISTS USING GOOGLE ID' });

    if (!user) {
      // check if email already exists
      const existingUserEmail = await User.findOne({ email: googleInfo.email });

      if (existingUserEmail) {
        console.log('EMAIL EXISTS');
        return res.status(StatusCodes.CONFLICT).json({
          data: {
            status: StatusCodes.CONFLICT,
            message: `User with email: ${googleInfo.email} already exists`,
          },
        });
      }

      console.log('GOOGLE SIGNUP');

      // regex to replace all spaces with underscores
      const userObj: {
        google: {
          id: string;
          name: string;
          email: string;
        };
        email: string;
        role: 'user';
        avatar?: string;
        verified: boolean;
        status: 'verified';
      } = {
        google: {
          id: googleInfo.id,
          name: googleInfo.name,
          email: googleInfo.email,
        },
        email: googleInfo.email,
        role: 'user',
        verified: true,
        status: 'verified',
      };

      const randomNumber = Math.floor(Math.random() * (4 - 1 + 1)) + 1;
      userObj.avatar = `https://robohash.org/${rand()}?set=${randomNumber}&size=500x500`;

      const newUser = await User.create(userObj);

      const { token: refresh_token, token_expires: refresh_token_expires } =
        generateToken(newUser._id, 'refresh');
      const { token: access_token, token_expires: access_token_expires } =
        generateToken(newUser._id, 'access');
      return res.status(StatusCodes.OK).json({
        data: {
          status: StatusCodes.OK,
          message: 'Welcome anonymous one',
          data: {
            user: {
              email: newUser.email,
            },
            refresh_token,
            access_token,
            refresh_token_expires,
            access_token_expires,
          },
        },
      });
    }

    if (user.deleted) {
      console.log('USER HAS BEEN DELETED');
      res.status(StatusCodes.NOT_FOUND).json({
        data: {
          message: 'User has been deleted',
          status: StatusCodes.NOT_FOUND,
        },
      });
    }

    console.log('GOOGLE SIGNIN');

    const { token: refresh_token, token_expires: refresh_token_expires } =
      generateToken(user._id, 'refresh');
    const { token: access_token, token_expires: access_token_expires } =
      generateToken(user._id, 'access');

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
    sendLoginEmail(user.user_name, user.email, message);

    return res.status(StatusCodes.OK).json({
      data: {
        status: StatusCodes.OK,
        message: 'Welcome anonymous one',
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
  }
);

export const verifyEmail = catchController(
  async (req: Request, res: Response) => {
    const email: string = req.body.email;
    const otp: string = req.body.otp;
    if (!email || !otp) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        data: {
          status: StatusCodes.BAD_REQUEST,
          message: passRequredFieldsMessage,
        },
      });
    }
    // find user with email
    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        data: {
          status: StatusCodes.NOT_FOUND,
          message: userNotFoundMessage,
        },
      });
    }
    // verify OTP
    const isValid = user.validateOTP(otp, user.otpToken, 'accountVerify');
    // update user's verified field to true
    if (isValid) {
      const { token: refresh_token, token_expires: refresh_token_expires } =
        generateToken(user._id, 'refresh');
      const { token: access_token, token_expires: access_token_expires } =
        generateToken(user.id, 'access');
      await user.save();
      return res.status(StatusCodes.OK).json({
        data: {
          status: StatusCodes.OK,
          message: 'Your email has been verified',
          data: {
            user: {
              user_name: user.user_name,
              email,
            },
            refresh_token,
            access_token,
            refresh_token_expires,
            access_token_expires,
          },
        },
      });
    }

    return res.status(StatusCodes.BAD_REQUEST).json({
      data: {
        status: StatusCodes.BAD_REQUEST,
        message: 'OTP is incorrect',
      },
    });
  }
);

export const login = catchController(async (req: Request, res: Response) => {
  const { identifier, password }: { identifier: string; password: string } =
    req.body;
  if (!identifier) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      data: {
        status: StatusCodes.BAD_REQUEST,
        message: 'Please provide a username or an email',
      },
    });
  }
  if (!password) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      data: {
        status: StatusCodes.BAD_REQUEST,
        message: 'Password field cannot be empty',
      },
    });
  }
  // find user with email or user_name and deleted field is false
  const user = await User.findOne({
    $or: [{ email: identifier.trim() }, { user_name: identifier.trim() }],
  }).select('+password -__v +status');
  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).json({
      data: {
        status: StatusCodes.NOT_FOUND,
        message: 'User with this email or username does not exist',
      },
    });
  }

  if (user.deleted) {
    return res.status(StatusCodes.NOT_FOUND).json({
      data: {
        status: StatusCodes.NOT_FOUND,
        message: 'This account has been deleted',
      },
    });
  }

  // Check if user is verified
  if (user.status !== 'verified') {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      data: {
        status: StatusCodes.UNAUTHORIZED,
        message: 'Please verify your email first',
      },
    });
  }
  // console.log({user})

  // verify password
  const isValid = await user.validatePassword(password);

  // console.log({isValid});

  if (isValid) {
    const { token: refresh_token, token_expires: refresh_token_expires } =
      generateToken(user._id, 'refresh');
    const { token: access_token, token_expires: access_token_expires } =
      generateToken(user.id, 'access');
    res.status(StatusCodes.OK).json({
      data: {
        status: StatusCodes.OK,
        message: 'User logged in successfully',
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
    sendLoginEmail(user.user_name, user.email, message);
    return;
  }
  return res.status(StatusCodes.BAD_REQUEST).json({
    data: {
      status: StatusCodes.BAD_REQUEST,
      message: 'Password is incorrect',
    },
  });
});

export const resendOTP = catchController(
  async (req: Request, res: Response) => {
    const email: string = req.body.email;
    const link: string = req.body.link;
    if (!email || !link) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        data: {
          status: StatusCodes.BAD_REQUEST,
          message: passRequredFieldsMessage,
        },
      });
    }
    // find user with email
    const user = await User.findOne({
      email,
      deleted: false,
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        data: {
          status: StatusCodes.NOT_FOUND,
          message: userNotFoundMessage,
        },
      });
    }
    // Create OTP using createOTP method
    const otp = user.createOTP();

    const message = `Use this code to verify your account`;
    // send OTP to user's email
    sendOTP(user.user_name, email, message, otp, link);

    await user.save();

    return res.status(StatusCodes.OK).json({
      data: {
        status: StatusCodes.OK,
        message: 'New OTP has been sent to your email',
      },
    });
  }
);

export const forgotPassword = catchController(
  async (req: Request, res: Response) => {
    const email: string = req.body.email;
    const link: string = req.body.link;
    if (!email || !link) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        data: {
          status: StatusCodes.BAD_REQUEST,
          message: passRequredFieldsMessage,
        },
      });
    }
    // find user with email
    const user = await User.findOne({
      email,
      deleted: false,
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        data: {
          status: StatusCodes.NOT_FOUND,
          message: userNotFoundMessage,
        },
      });
    }
    // Create OTP using createOTP method
    const otp = user.createOTP();

    const message = `Click the button to reset your password`;

    await user.save();
    // send OTP to user's email
    await sendPasswordResetLink(user.user_name, email, message, otp, link);

    return res.status(StatusCodes.OK).json({
      data: {
        status: StatusCodes.OK,
        message: 'Your password reset details has been sent to your email',
      },
    });
  }
);

export const resetPassword = catchController(
  async (req: Request, res: Response) => {
    const email: string = req.body.email;
    const otp: string = req.body.otp;
    const password: string = req.body.password;
    if (!email || !otp || !password) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        data: {
          status: StatusCodes.BAD_REQUEST,
          message: passRequredFieldsMessage,
        },
      });
    }
    // find user with email
    const user = await User.findOne({
      email,
      deleted: false,
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: StatusCodes.NOT_FOUND,
        message: userNotFoundMessage,
      });
    }

    if (!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        data: {
          status: StatusCodes.BAD_REQUEST,
          message: passwordRegexMessage,
        },
      });
    }

    // verify OTP
    const isValid = user.validateOTP(otp, user.otpToken, 'passwordReset');
    // update user's verified field to true
    if (isValid) {
      user.password = password;
      await user.save();
      res.status(StatusCodes.OK).json({
        data: {
          status: StatusCodes.OK,
          message: 'Your password has been reset',
        },
      });
      await sendPasswordChanged(
        user.user_name,
        email,
        'Enjoy the App anonymous one!'
      );
      return;
    }

    return res.status(StatusCodes.BAD_REQUEST).json({
      data: {
        status: StatusCodes.BAD_REQUEST,
        message: 'OTP is incorrect',
      },
    });
  }
);

export const updatePassword = catchController(
  async (req: Request, res: Response) => {
    const user_id: Types.ObjectId = req.user._id;
    const password: string = req.body.password;
    if (!user_id || !password) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        data: {
          status: StatusCodes.BAD_REQUEST,
          message: passRequredFieldsMessage,
        },
      });
    }
    // find user with user_id
    const user = await User.findOne({
      _id: user_id,
      deleted: false,
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        data: {
          status: StatusCodes.NOT_FOUND,
          message: 'User with this user_id does not exist',
        },
      });
    }

    if (!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        data: {
          status: StatusCodes.BAD_REQUEST,
          message: passwordRegexMessage,
        },
      });
    }

    // update user's password
    user.password = password;
    await user.save();
    res.status(StatusCodes.OK).json({
      data: {
        status: StatusCodes.OK,
        message: 'Your password has been updated',
      },
    });
    await sendPasswordChanged(
      user.user_name,
      user.email,
      'Enjoy the App anonymous one!'
    );
  }
);

export const getAccessToken = catchController(
  async (req: Request, res: Response) => {
    const { refreshToken }: { refreshToken: string | undefined } = req.body;
    if (!refreshToken) return resp.setError(400, 'token is missing').send(res);

    const decoded = <{ id: string; type: string }>(
      jwt.verify(refreshToken, process.env.JWT_SECRET_KEY as string)
    );

    if (decoded.type && decoded.type !== 'string') {
      return resp
        .setError(400, 'invalid token provided. please provide a refresh token')
        .send(res);
    }

    const user = await User.findOne({ _id: decoded.id });

    if (!user) return resp.setError(400, 'invalid refresh token').send(res);
    const { token: refresh_token, token_expires: refresh_token_expires } =
      generateToken(user._id, 'refresh');
    const { token: access_token, token_expires: access_token_expires } =
      generateToken(user.id, 'access');

    return resp
      .setSuccess(
        200,
        {
          access_token,
          refresh_token,
          refresh_token_expires,
          access_token_expires,
        },
        'access token generated successfully'
      )
      .send(res);
  }
);
