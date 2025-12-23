import { NextAuthOptions } from 'next-auth';
import https from 'https';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
// import DropboxProvider from 'next-auth/providers/dropbox';
import connectDB from './db';
import Token from './models/Token';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const adminUsername = process.env.ADMIN_USERNAME;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminUsername || !adminPassword) {
          throw new Error('Admin credentials not configured');
        }

        if (
          credentials?.username === adminUsername &&
          credentials?.password === adminPassword
        ) {
          return {
            id: 'admin',
            name: 'Admin',
            email: 'admin@photobook.local',
          };
        }

        return null;
      },
    }),
    GoogleProvider({
      id: "googledrive",
      name: "Google Drive",
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'email profile https://www.googleapis.com/auth/drive.readonly',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
      httpOptions: {
        timeout: 60000,
        agent: new https.Agent({ keepAlive: true, family: 4 }),
      },
    }),
    GoogleProvider({
      id: "googlephotos",
      name: "Google Photos",
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'email profile https://www.googleapis.com/auth/photospicker.mediaitems.readonly',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
      httpOptions: {
        timeout: 60000,
        agent: new https.Agent({ keepAlive: true, family: 4 }),
      },
    }),
    // DropboxProvider({
    //   clientId: process.env.DROPBOX_CLIENT_ID!,
    //   clientSecret: process.env.DROPBOX_CLIENT_SECRET!,
    // }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Store Google Drive OAuth tokens
      if (account?.provider === 'googledrive' && account.access_token) {
        try {
          console.log('🔍 Google Drive OAuth Callback');
          console.log('- Provider:', account.provider);
          console.log('- Scope returned by Google:', account.scope);
          console.log('- Has refresh_token:', !!account.refresh_token);
          console.log('- Has access_token:', !!account.access_token);

          await connectDB();

          // Check if we already have a token with refresh_token
          const existingToken = await Token.getToken('googledrive');
          
          // Use existing refresh_token if new one not provided, or use new one
          const refreshTokenToUse = account.refresh_token || existingToken?.refreshToken;

          if (!refreshTokenToUse) {
            console.error('❌ No refresh token available and none in database');
            console.error('   Google may not return refresh_token if user already authorized.');
            console.error('   Try revoking access at: https://myaccount.google.com/permissions');
          }

          // Calculate expiresIn (Google tokens typically expire in 1 hour)
          const expiresIn = typeof account.expires_in === 'number'
            ? account.expires_in
            : 3600;

          if (refreshTokenToUse) {
            await Token.updateToken(
              'googledrive',
              refreshTokenToUse,
              account.access_token,
              expiresIn
            );
            console.log('✅ Successfully stored Google Drive OAuth tokens');
          } else {
            console.warn('⚠️  Could not store tokens - missing refresh_token. Access token will expire soon.');
          }
        } catch (error) {
          console.error('❌ Error storing Google Drive tokens:', error);
          if (error instanceof Error) {
            console.error('   Error message:', error.message);
            console.error('   Error stack:', error.stack);
          }
          // Don't block sign-in if token storage fails
        }
      }

      // Store Google Photos OAuth tokens
      if (account?.provider === 'googlephotos' && account.access_token) {
        try {
          console.log('🔍 Google Photos OAuth Callback');
          console.log('- Provider:', account.provider);
          console.log('- Scope returned by Google:', account.scope);
          console.log('- Has refresh_token:', !!account.refresh_token);
          console.log('- Has access_token:', !!account.access_token);

          await connectDB();

          // Check if we already have a token with refresh_token
          const existingToken = await Token.getToken('googlephotos');
          
          // Use existing refresh_token if new one not provided, or use new one
          const refreshTokenToUse = account.refresh_token || existingToken?.refreshToken;

          if (!refreshTokenToUse) {
            console.error('❌ No refresh token available and none in database');
            console.error('   Google may not return refresh_token if user already authorized.');
            console.error('   Try revoking access at: https://myaccount.google.com/permissions');
          }

          // Calculate expiresIn (Google tokens typically expire in 1 hour)
          const expiresIn = typeof account.expires_in === 'number'
            ? account.expires_in
            : 3600;

          if (refreshTokenToUse) {
            await Token.updateToken(
              'googlephotos',
              refreshTokenToUse,
              account.access_token,
              expiresIn
            );
            console.log('✅ Successfully stored Google Photos OAuth tokens');
          } else {
            console.warn('⚠️  Could not store tokens - missing refresh_token. Access token will expire soon.');
          }
        } catch (error) {
          console.error('❌ Error storing Google Photos tokens:', error);
          if (error instanceof Error) {
            console.error('   Error message:', error.message);
            console.error('   Error stack:', error.stack);
          }
          // Don't block sign-in if token storage fails
        }
      }

      // Store Dropbox OAuth tokens (COMMENTED OUT)
      // if (account?.provider === 'dropbox' && account.access_token) {
      //   try {
      //     console.log('🔍 Dropbox OAuth Callback');
      //     console.log('- Has refresh_token:', !!account.refresh_token);
      //     console.log('- Has access_token:', !!account.access_token);

      //     await connectDB();

      //     // Dropbox tokens expire in 4 hours (14400 seconds)
      //     const expiresIn = typeof account.expires_in === 'number'
      //       ? account.expires_in
      //       : 14400;

      //     // Note: Dropbox might not return a refresh token on subsequent logins unless access is revoked
      //     // We should only update if we have a refresh token, or if we already have one in DB
      //     if (account.refresh_token) {
      //       await Token.updateToken(
      //         'dropbox',
      //         account.refresh_token,
      //         account.access_token,
      //         expiresIn
      //       );
      //       console.log('✅ Successfully stored Dropbox OAuth tokens');
      //     } else {
      //       // If no refresh token, we might want to just update the access token if we have a refresh token in DB
      //       // But Token.updateToken requires a refresh token.
      //       // For now, let's assume we get it or we might need to fetch existing one.
      //       const existingToken = await Token.getToken('dropbox');
      //       if (existingToken) {
      //         await Token.updateToken(
      //           'dropbox',
      //           existingToken.refreshToken,
      //           account.access_token,
      //           expiresIn
      //         );
      //         console.log('✅ Successfully updated Dropbox access token (kept existing refresh token)');
      //       } else {
      //         console.warn('⚠️  Dropbox did not return a refresh token and none found in DB. You may need to revoke access to get a new one.');
      //       }
      //     }
      //   } catch (error) {
      //     console.error('❌ Error storing Dropbox tokens:', error);
      //   }
      // }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/admin/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development', // Enable debug mode in development
  logger: {
    error(code, metadata) {
      console.error('❌ [NextAuth Error]', code, metadata);
    },
    warn(code) {
      console.warn('⚠️  [NextAuth Warning]', code);
    },
    debug(code, metadata) {
      console.log('🔍 [NextAuth Debug]', code, metadata);
    },
  },
};

