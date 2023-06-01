import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import SMTPTransport, { Options } from 'nodemailer/lib/smtp-transport';
import path from 'path';
import pug from 'pug';

// const transporter = nodemailer.createTransport({
//   service: 'hotmail',
//   auth: {
//     user: process.env.E_U,
//     pass: process.env.APP_PASS_O,
//   },
//   secure: false,
// });

const createTransporter = async () => {
  const OAuth2 = google.auth.OAuth2;
  const oauth2Client = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN,
  });

  const accessToken: string = await new Promise((resolve, reject) => {
    oauth2Client.getAccessToken((err, token) => {
      if (err) {
        console.log({ err });
        reject('Failed to create access token');
      }
      resolve(token as string);
    });
  });

  const config: Options = {
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.EMAIL,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      accessToken,
    },
    port: 25,
    secure: false,
    tls: {
      rejectUnauthorized: false,
    },
  };

  return nodemailer.createTransport({ ...config });
};

const emailPath = '../../emailViews/';

/*
  private async setTransport() {
    const OAuth2 = google.auth.OAuth2;
    const oauth2Client = new OAuth2(
      this.configService.get('CLIENT_ID'),
      this.configService.get('CLIENT_SECRET'),
      'https://developers.google.com/oauthplayground',
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.REFRESH_TOKEN,
    });

    const accessToken: string = await new Promise((resolve, reject) => {
      oauth2Client.getAccessToken((err, token) => {
        if (err) {
          reject('Failed to create access token');
        }
        resolve(token as string);
      });
    });

    const config: Options = {
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: this.configService.get('EMAIL'),
        clientId: this.configService.get('CLIENT_ID'),
        clientSecret: this.configService.get('CLIENT_SECRET'),
        accessToken,
      },
      port: 25,
      secure: false,
      tls: {
        rejectUnauthorized: false,
      },
    };

    this.mailService.addTransporter('gmail', config);
  }
*/

export const sendOTP = async (
  user_name: string,
  email: string,
  message: string,
  otp: string,
  link: string
) => {
  const transporter: Promise<
    nodemailer.Transporter<SMTPTransport.SentMessageInfo>
  > = createTransporter();
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
      from: `Anonry <${process.env.E_U}>`,
      subject: 'Verify your email',
      to: email,
      html,
    };
    (await transporter).sendMail(mailOptions);
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
  const transporter: Promise<
    nodemailer.Transporter<SMTPTransport.SentMessageInfo>
  > = createTransporter();
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
      from: `Anonry <${process.env.E_U}>`,
      subject: 'Reset your password',
      to: email,
      html,
    };

    (await transporter).sendMail(mailOptions);
    // await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(error);
  }
};

export const sendPasswordChanged = async (
  user_name: string,
  email: string,
  message: string
) => {
  const transporter: Promise<
    nodemailer.Transporter<SMTPTransport.SentMessageInfo>
  > = createTransporter();
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
      from: `Anonry <${process.env.E_U}>`,
      subject: 'Password Updated',
      to: email,
      html,
    };
    (await transporter).sendMail(mailOptions);
  } catch (error) {
    console.error(error);
  }
};

export const sendLoginEmail = async (
  user_name: string,
  email: string,
  message: string
) => {
  const transporter: Promise<
    nodemailer.Transporter<SMTPTransport.SentMessageInfo>
  > = createTransporter();
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
      from: `Anonry <${process.env.E_U}>`,
      subject: 'Login Notification',
      to: email,
      html,
    };

    // console.log({ mailOptions });
    (await transporter).sendMail(mailOptions);
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
