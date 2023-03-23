// import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import path from 'path';
import pug from 'pug';

const transporter = nodemailer.createTransport({
  service: 'hotmail',
  secure: true,
  port: 465,
  auth: {
    user: process.env.E_U,
    pass: process.env.APP_PASS_O,
  },
});
const emailPath = '../../emailViews/';

export const sendOTP = async (
  user_name: string,
  email: string,
  message: string,
  otp: string,
  link: string
) => {
  try {
    const html = pug.renderFile(
      path.join(__dirname, emailPath, 'verifyEmail.pug'),
      {
        user_name,
        subject:
          'Welcome to Anonry. Glad to have you on board. We just need to verify your email',
        message,
        link,
        otp,
      }
    );
    const mailOptions = {
      from: `Anonry <${process.env.EMAIL_USERNAME}>`,
      subject: 'Verify your email',
      to: process.env.EMAIL_USERNAME,
      html,
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(error);
  }
};

export const sendPasswordResetLink = async (
  user_name: string,
  email: string,
  message: string,
  otp: string,
  link: string
) => {
  try {
    const html = pug.renderFile(
      path.join(__dirname, emailPath, 'passwordReset.pug'),
      {
        user_name,
        subject: 'Reset your password',
        link,
        otp,
        message,
      }
    );
    const mailOptions = {
      from: `Anonry <${process.env.EMAIL_USERNAME}>`,
      subject: 'Reset your password',
      to: email,
      html,
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(error);
  }
};

export const sendPasswordChanged = async (
  user_name: string,
  email: string,
  message: string
) => {
  try {
    const html = pug.renderFile(
      path.join(__dirname, emailPath, 'passwordChanged.pug'),
      {
        user_name,
        subject: 'Your password has been changed',
        message,
      }
    );
    const mailOptions = {
      from: `Anonry <${process.env.EMAIL_USERNAME}>`,
      subject: 'Password Updated',
      to: email,
      html,
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(error);
  }
};

export const sendLoginEmail = async (
  user_name: string,
  _email: string,
  message: string
) => {
  console.log('sendLoginEmail');
  try {
    const html = pug.renderFile(
      path.join(__dirname, emailPath, 'loginEmail.pug'),
      {
        user_name,
        subject: 'Hello anonymous one',
        message,
      }
    );
    const mailOptions = {
      from: `Anonry <${process.env.EMAIL_USERNAME}>`,
      subject: 'Login Notification',
      to: process.env.EMAIL_USERNAME,
      html,
    };

    // console.log({ mailOptions });
    await transporter.sendMail(mailOptions);
    console.log('sent');
  } catch (error) {
    console.error(error);
  }
};

// service: 'gmail',
// host: process.env.EMAIL_HOST,
// port: 465,
// secure: true,
// auth: {
//   user: process.env.EMAIL_USERNAME,
//   pass: process.env.EMAIL_PASSWORD,
//   type: 'login'
// },

// host: process.env.EMAIL_HOST,
// auth: {
//   // user: process.env.EMAIL_USERNAME,
//   // pass: process.env.EMAIL_PASSWORD,
//   type: 'OAuth2',
//   user: process.env.EMAIL_USERNAME,
//   clientId: process.env.OAUTH_CLIENT_ID,
//   clientSecret: process.env.OAUTH_CLIENT_SECRET,
//   refreshToken:

// },

// service: 'gmail',
// port: 465,
// secure: true,
// auth: {
//   user: process.env.EMAIL_USERNAME,
//   pass: process.env.EMAIL_PASSWORD,
// },

// host: 'smtp.ethereal.email',
// port: 465,
// secure: true, // true for 465, false for other ports
// auth: {
//   user: testAccount.user, // generated ethereal user
//   pass: testAccount.pass, // generated ethereal password
// },

// const createTransport = async () => {
//   return nodemailer.createTransport({
//     // service: 'gmail',
//     // host: process.env.EMAIL_HOST,
//     // port: 465,
//     // secure: true,
//     // auth: {
//     //   user: process.env.EMAIL_USERNAME,
//     //   pass: process.env.EMAIL_PASSWORD,
//     //   type: 'login'
//     // },

//     // host: process.env.EMAIL_HOST,
//     // auth: {
//     //   // user: process.env.EMAIL_USERNAME,
//     //   // pass: process.env.EMAIL_PASSWORD,
//     //   type: 'OAuth2',
//     //   user: process.env.EMAIL_USERNAME,
//     //   clientId: process.env.OAUTH_CLIENT_ID,
//     //   clientSecret: process.env.OAUTH_CLIENT_SECRET,
//     //   refreshToken:
//     // },

//     // service: 'gmail',
//     // port: 465,
//     // secure: true,
//     // auth: {
//     //   user: process.env.EMAIL_USERNAME,
//     //   pass: process.env.EMAIL_PASSWORD,
//     // },

//     // host: 'smtp.ethereal.email',
//     // port: 465,
//     // secure: true, // true for 465, false for other ports
//     // auth: {
//     //   user: testAccount.user, // generated ethereal user
//     //   pass: testAccount.pass, // generated ethereal password
//     // },

//     service: 'hotmail',
//     auth: {
//       user: process.env.E_U,
//       pass: process.env.E_S
//     }
//   });
// };
// const OAuth2Client = new google.auth.OAuth2(
//   process.env.OAUTH_CLIENT_ID,
//   process.env.OAUTH_CLIENT_SECRET,
//   process.env.OAUTH_REDIRECT_URL
// );

// OAuth2Client.setCredentials({
//   refresh_token: process.env.OAUTH_REFRESH_TOKEN,
// });

// google.options({ auth: OAuth2Client });

// const createTransporter = async () => {
//   console.log('here');
//   const accessToken = OAuth2Client.getAccessToken(async (err, res) => {
//     console.log({ err, res });
//   });
//   console.log('after');
//   console.log({ accessToken });
//   // return nodemailer.createTransport({
//   //   service: 'gmail',
//   //   auth: {
//   //     type: 'OAuth2',
//   //     user: process.env.EMAIL_USERNAME,
//   //     clientId: process.env.OAUTH_CLIENT_ID,
//   //     clientSecret: process.env.OAUTH_CLIENT_SECRET,
//   //     accessToken: acc,
//   //     refreshToken: process.env.OAUTH_REFRESH_TOKEN,
//   //   },
//   // });
// };

// const transporter = nodemailer.createTransport({
//   // service: 'gmail',
//   // host: process.env.EMAIL_HOST,
//   // port: 465,
//   // secure: true,
//   // auth: {
//   //   user: process.env.EMAIL_USERNAME,
//   //   pass: process.env.EMAIL_PASSWORD,
//   //   type: 'login'
//   // },

//   // host: process.env.EMAIL_HOST,
//   // auth: {
//   //   // user: process.env.EMAIL_USERNAME,
//   //   // pass: process.env.EMAIL_PASSWORD,
//   //   type: 'OAuth2',
//   //   user: process.env.EMAIL_USERNAME,
//   //   clientId: process.env.OAUTH_CLIENT_ID,
//   //   clientSecret: process.env.OAUTH_CLIENT_SECRET,
//   //   refreshToken:

//   // },

//   // service: 'gmail',
//   // port: 465,
//   // secure: true,
//   // auth: {
//   //   user: process.env.EMAIL_USERNAME,
//   //   pass: process.env.EMAIL_PASSWORD,
//   // },

//   host: 'smtp.ethereal.email',
//   port: 587,
//   secure: false, // true for 465, false for other ports
//   auth: {
//     user: testAccount.user, // generated ethereal user
//     pass: testAccount.pass, // generated ethereal password
//   },
// });
