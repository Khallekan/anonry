import passport from "passport";
import {
  Profile,
  Strategy as GoogleStrategy,
  VerifyCallback,
} from "passport-google-oauth20";
import User from "../../users/model/userModel";
import jwt from "jsonwebtoken";
// generate a random whole number between 1 and 1 million

const rand = (): number => Math.floor(Math.random() * 1000000 + 1);

passport.use(
  new GoogleStrategy(
    {
      clientID: `${process.env.OAUTH_CLIENT_ID}`,
      clientSecret: `${process.env.OAUTH_CLIENT_SECRET}`,
      callbackURL: `/users/auth/google/callback`,
      scope: ["email", "profile"],
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback
    ) => {
      const user = await User.findOne({
        $or: [{ "google.id": profile.id }, { email: profile._json.email }],
      });
      // const decoded = jwt.verify(
      //   accessToken,
      //   process.env.OAUTH_CLIENT_SECRET as string
      // );

      console.log({ accessToken });

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
          user_name: profile.displayName
            .trim()
            .replace(spaceRegex, "_")
            .toLowerCase(),
          email: profile._json.email || "",
          role: "user",
          verified: true,
          status: "verified",
        };
        const existingUserName = await User.findOne({
          user_name: { $regex: userObj.user_name, $options: "i" },
        });

        let userNameExists: boolean = !!existingUserName;
        console.log({ userNameExists, userName: userObj.user_name });

        while (userNameExists) {
          console.log("ENTERED HERE FOR SOME REASON");

          userObj.user_name = `${profile.displayName
            .trim()
            .replace(spaceRegex, "_")
            .toLocaleLowerCase()}_${rand()}`;
          const newUserNameExists = await User.findOne({
            $regex: userObj.user_name,
            $options: "i",
          });
          console.log({ newUserNameExists, userName: userObj.user_name });

          if (newUserNameExists) {
            console.log("ALLOWS THE WHILE LOOP EXIT");

            userNameExists = false;
          }
        }

        const randomNumber = Math.floor(Math.random() * (4 - 1 + 1)) + 1;
        userObj.avatar = `https://robohash.org/${userObj.user_name}?set=${randomNumber}&size=500x500`;

        const newUser = await User.create(userObj);

        done(null, newUser);

        return;
      }
      done(null, user);
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  console.log("Deserializing user...");

  console.log({ id });

  User.findById(id, (err, user) => {
    console.log({ user });
    done(err, user);
  });
});
