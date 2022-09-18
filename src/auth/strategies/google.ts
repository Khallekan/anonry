import passport from "passport";
import {
  Profile,
  Strategy as GoogleStrategy,
  VerifyCallback,
} from "passport-google-oauth20";

passport.use(
  new GoogleStrategy(
    {
      clientID: `${process.env.OAUTH_CLIENT_ID}`,
      clientSecret: `${process.env.OAUTH_CLIENT_SECRET}`,
      callbackURL: `${process.env.OAUTH_REDIRECT_URL}`,
      scope: ["email", "profile"],
      passReqToCallback: true,
    },
    async (
      request,
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback
    ) => {
      console.log({
        accessToken,
        refreshToken,
        profile,
        done,
      });
    }
  )
);
