import GooglePassport from "passport-google-oauth20";
import passport from "passport";
import config from "../../config/index.js";
const GoogleStrategy = GooglePassport.Strategy;
export const PassportGoogle = () =>
  passport.use(
    new GoogleStrategy(
      {
        callbackURL: `http://localhost:${config.port}/api/auth/google/callback`,
        clientID: config.googleClientId,
        clientSecret: config.googleClientSecret,
        passReqToCallback: true,
      },
      (req, _, __, profile, done) => {
        try {
          if (profile) {
            //req.userProfile = profile;
            req.user = profile;

            done(undefined, profile);
          }
        } catch (error) {
          done(error);
        }
      }
    )
  );
