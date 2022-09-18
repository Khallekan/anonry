import passport from "passport";
import {
  Profile,
  Strategy as GoogleStrategy,
  VerifyCallback,
} from "passport-google-oauth20";
import User from "../../users/model/userModel";

// generate a random whole number between 1 and 1 million

const rand = (): number => Math.floor(Math.random() * 1000000 + 1);

passport.serializeUser((user, done) => {
  done(null, user.id);
})

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: `${process.env.OAUTH_CLIENT_ID}`,
      clientSecret: `${process.env.OAUTH_CLIENT_SECRET}`,
      callbackURL: `/users/auth/signup/google/callback`,
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
      const user = await User.findOne({
        $or: [{ "google.id": profile.id }, { email: profile._json.email }],
      });

      if (!user) {
        // regex to replace all spaces with underscores
        const spaceRegex = /\s/g;
        const userObj: {
          google: {
            id: string;
            name: string;
            email: string;
          };
          user_name: string;
          email: string;
          role: "user";
          avatar?: string;
          verified: boolean;
          status: "verified";
        } = {
          google: {
            id: profile.id,
            name: profile.displayName,
            email: profile._json.email || "",
          },
          user_name: profile.displayName.trim().replace(spaceRegex, "_"),
          email: profile._json.email || "",
          role: "user",
          verified: true,
          status: "verified",
        };
        const existingUserName = await User.findOne({
          $regex: userObj.user_name,
          $options: "i",
        });

        let userNameExists: boolean = !!existingUserName;
        while (userNameExists) {
          userObj.user_name = `${profile.displayName
            .trim()
            .replace(spaceRegex, "_")}_${rand()}`;
          const newUserNameExists = await User.findOne({
            $regex: userObj.user_name,
            $options: "i",
          });
          if (!newUserNameExists) {
            userNameExists = false;
          }
        }
        const randomNumber = Math.floor(Math.random() * (4 - 1 + 1)) + 1;
        userObj.avatar = `https://robohash.org/${userObj.user_name}?set=${randomNumber}&size=500x500`;

        const newUser = await User.create(userObj);
        done(null, newUser);
        return;
      }
      done(new Error("User with email already exists"));
    }
  )
);
