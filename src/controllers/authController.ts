import { fromNodeHeaders } from 'better-auth/node';
import { Request, Response } from 'express';
import { auth } from '../auth.js';
import { routesProtecter } from '../middlewares/protectingRoutes.js';
import { Session } from '../models/sessionModel.js';
import User from '../models/userModel.js';
import { validateSignin } from '../requests/signinRequest.js';
import { validateSignup } from '../requests/signupRequest.js';
import {
  Controller,
  Delete,
  Post,
} from '../utils/decorators/routesDecorators.js';
import { generateUsername } from '../utils/generateUsername.js';

@Controller('/api/v1/')
export default class AuthController {
  @Post('sign-up', validateSignup)
  public async signup(req: Request, res: Response) {
    const { email, password, passwordConfirm, firstName, lastName } = req.body;

    if (password !== passwordConfirm)
      res.status(400).json({
        status: 'fail',
        message: "Passwords don't match",
      });

    const user = await User.findOne({ email });

    if (user)
      res.status(400).json({
        status: 'fail',
        message: 'User is already exists',
      });

    const username = await generateUsername(firstName, lastName);
    req.body.username = username;

    const newUser = await auth.api.signUpEmail({
      body: req.body,
    });

    const expiresIn = 60 * 60 * 24 * 7 * 1000;
    const expiresAt = new Date(Date.now() + expiresIn);

    res.cookie('better-auth.session_token', newUser.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });

    res.status(201).json({
      status: 'success',
      data: newUser,
      message: 'Account has been created Successfully!',
    });
  }

  @Post('sign-in', validateSignin)
  public async signIn(req: Request, res: Response) {
    const data = await auth.api.signInEmail({
      body: req.body,
      asResponse: true,
    });

    if (!data.ok) {
      const errorData = await data.json();
      return res.status(data.status).json({
        status: 'fail',
        message: errorData.body?.message || errorData.message || 'Login failed',
      });
    }

    const cookieHeader = data.headers.get('set-cookie');

    if (cookieHeader) {
      res.setHeader('Set-Cookie', cookieHeader);
    }

    const user = await data.json();

    res.status(200).json({
      status: 'success',
      data: user,
      message: 'Logged in successfully',
    });
  }

  @Post('sign-in-with-google')
  public async signInWithGoogle(req: Request, res: Response) {
    const { callbackURL } = req.body;

    if (!callbackURL)
      res.status(400).json({
        status: 'fail',
        message: 'callbackURL is required',
      });

    const data = await auth.api.signInSocial({
      body: {
        provider: 'google',
        callbackURL,
      },
    });

    const { url } = data;

    if (!url) {
      return res.status(500).json({ message: 'Failed to generate Google URL' });
    }

    res.status(200).json({
      status: 'success',
      url: url,
    });
  }

  @Delete('logout', routesProtecter)
  public async logout(req: Request, res: Response) {
    const userId = res.locals.user.id;

    const response = await auth.api.signOut({
      headers: fromNodeHeaders(req.headers),
      asResponse: true,
    });

    await Session.deleteMany({ userId: userId });

    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      res.setHeader('Set-Cookie', setCookie);
    }

    res
      .status(200)
      .json({ status: 'success', message: 'Logged out successfully' });
  }
}
