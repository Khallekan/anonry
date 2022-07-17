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
const sendOTP = async (user_name: string, email: string, message: string, otp: string) =>
  // eslint-disable-next-line consistent-return
  {
    try {
      const html = pug.renderFile(
        path.join(__dirname, "../../emailViews/", "verifyEmail.pug"),
        {
          user_name: user_name,
          subject:
            "Welcome to Anonry. Glad to have you on board. We just need to verify your email",
          message,
          link: `${process.env.FRONTEND_URL}/verify-email?email=${email}`,
          otp,
        }
      );
      const mailOptions = {
        from: `Anonry <${process.env.EMAIL_USERNAME}>`,
        subject: "Verify your email",
        to: email,
        html,
      };
      const something = await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error(error);
    }
  };

export { sendOTP };
