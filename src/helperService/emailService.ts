import nodemailer from "nodemailer";
import path from "path";
import pug from "pug";
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});
export const sendOTP = async (
  user_name: string,
  email: string,
  message: string,
  otp: string,
  link: string
) =>
  // eslint-disable-next-line consistent-return
  {
    try {
      const html = pug.renderFile(
        path.join(__dirname, "../../emailViews/", "verifyEmail.pug"),
        {
          user_name,
          subject:
            "Welcome to Anonry. Glad to have you on board. We just need to verify your email",
          message,
          link,
          otp,
        }
      );
      const mailOptions = {
        from: `Anonry <${process.env.EMAIL_USERNAME}>`,
        subject: "Verify your email",
        to: email,
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
      path.join(__dirname, "../../emailViews/", "passwordReset.pug"),
      {
        user_name,
        subject: "Reset your password",
        link,
        otp,
        message,
      }
    );
    const mailOptions = {
      from: `Anonry <${process.env.EMAIL_USERNAME}>`,
      subject: "Reset your password",
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
      path.join(__dirname, "../../emailViews/", "passwordChanged.pug"),
      {
        user_name,
        subject: "Your password has been changed",
        message,
      }
    );
    const mailOptions = {
      from: `Anonry <${process.env.EMAIL_USERNAME}>`,
      subject: "Password Updated",
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
  email: string,
  message: string
) => {
  console.log("sendLoginEmail");

  console.log({ user_name, email, message });

  try {
    const html = pug.renderFile(
      path.join(__dirname, "../../emailViews/", "loginEmail.pug"),
      {
        user_name,
        subject: "Hello anonymous one",
        message,
      }
    );
    const mailOptions = {
      from: `Anonry <${process.env.EMAIL_USERNAME}>`,
      subject: "Login Notification",
      to: email,
      html,
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(error);
  }
};
