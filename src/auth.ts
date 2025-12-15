/* eslint-disable @typescript-eslint/no-explicit-any */
import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import 'dotenv/config';
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.DATABASE_LOCAL!);
const db = client.db();

export const auth = betterAuth({
  database: mongodbAdapter(db as any),
  baseURL: process.env.BACKEND_URL!,
  trustedOrigins: [process.env.BACKEND_URL!, 'http:localhost:3001'],
  secret: process.env.BETTER_AUTH_SECRET,
  advanced: {
    useSecureCookies: false,
    cookiePrefix: 'better-auth',
    defaultCookieAttributes: {
      sameSite: 'lax',
      httpOnly: true,
      secure: false,
    },
  },
  user: {
    additionalFields: {
      firstName: { type: 'string' },
      middleName: { type: 'string' },
      lastName: { type: 'string' },
      username: { type: 'string' },
      phoneNumber: { type: 'string' },
      bio: { type: 'string' },
      image: { type: 'string' },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    },
  },

  // Optional: Add Google, GitHub, etc.
});
