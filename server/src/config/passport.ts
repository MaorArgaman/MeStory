import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User, UserRole } from '../models/User';

/**
 * Configure Passport Google OAuth Strategy
 * Section 3.2: User Profile Features - Connected Accounts
 */
export const configurePassport = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5001/api/auth/google/callback';

  // Check if Google OAuth is configured
  if (!clientId || !clientSecret || clientId === 'your-google-client-id') {
    console.warn('⚠️  Google OAuth not configured - skipping Google login strategy');
    console.warn('   Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env to enable');
    return false;
  }

  // Configure Google Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: clientId,
        clientSecret: clientSecret,
        callbackURL: callbackURL,
        scope: ['profile', 'email'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          // Extract user info from Google profile
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName || profile.name?.givenName || 'User';
          const avatar = profile.photos?.[0]?.value;

          if (!email) {
            return done(new Error('No email provided by Google'), undefined);
          }

          // Check if user already exists
          let user = await User.findOne({ email });

          if (user) {
            // User exists - update profile if needed
            if (avatar && !user.profile?.avatar) {
              if (!user.profile) {
                user.profile = {};
              }
              user.profile.avatar = avatar;
              await user.save();
            }

            return done(null, user);
          }

          // User doesn't exist - create new user
          user = new User({
            name,
            email,
            password: Math.random().toString(36).slice(-8), // Random password (won't be used)
            role: UserRole.FREE,
            credits: 100, // Free tier credits
            profile: {
              avatar,
            },
          });

          await user.save();

          console.log(`✅ New user created via Google OAuth: ${email}`);
          return done(null, user);
        } catch (error) {
          console.error('Google OAuth error:', error);
          return done(error as Error, undefined);
        }
      }
    )
  );

  // Serialize user to session
  passport.serializeUser((user: any, done) => {
    done(null, user._id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  console.log('✅ Google OAuth strategy configured');
  return true;
};
