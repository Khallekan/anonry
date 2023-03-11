import passport from 'passport';
import {
  Profile,
  Strategy as GoogleStrategy,
  VerifyCallback,
} from 'passport-google-oauth20';

import User from '../../users/model/userModel';
import { rand } from '../../utils/randomNumber';
// generate a random whole number between 1 and 1 million

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});
//  {
// [1]   userInfo: {
// [1]     id: '118003239192181473774',
// [1]     email: 'totstater972@gmail.com',
// [1]     verified_email: true,
// [1]     name: 'Tater Tots',
// [1]     given_name: 'Tater',
// [1]     family_name: 'Tots',
// [1]     picture: 'https://lh3.googleusercontent.com/a/ALm5wu2aZGOxPmbyOjHynyl3TXZ4qPX9D9kaswK2Dlo=s96-c',
// [1]     locale: 'en'
// [1]   }
// [1] }
passport.use(
  new GoogleStrategy(
    {
      clientID: `${process.env.OAUTH_CLIENT_ID}`,
      clientSecret: `${process.env.OAUTH_CLIENT_SECRET}`,
      callbackURL: `/users/auth/signup/google/callback`,
      scope: ['email', 'profile'],
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
        $or: [{ 'google.id': profile.id }, { email: profile._json.email }],
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
          role: 'user';
          avatar?: string;
          verified: boolean;
          status: 'verified';
        } = {
          google: {
            id: profile.id,
            name: profile.displayName,
            email: profile._json.email || '',
          },
          user_name: profile.displayName
            .trim()
            .replace(spaceRegex, '_')
            .toLowerCase(),
          email: profile._json.email || '',
          role: 'user',
          verified: true,
          status: 'verified',
        };
        const existingUserName = await User.findOne({
          user_name: { $regex: userObj.user_name, $options: 'i' },
        });

        let userNameExists = !!existingUserName;
        console.log({ userNameExists, userName: userObj.user_name });

        while (userNameExists) {
          console.log('ENTERED HERE FOR SOME REASON');

          userObj.user_name = `${profile.displayName
            .trim()
            .replace(spaceRegex, '_')
            .toLocaleLowerCase()}_${rand()}`;
          const newUserNameExists = await User.findOne({
            $regex: userObj.user_name,
            $options: 'i',
          });
          console.log({ newUserNameExists, userName: userObj.user_name });

          if (newUserNameExists) {
            console.log('ALLOWS THE WHILE LOOP EXIT');

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
