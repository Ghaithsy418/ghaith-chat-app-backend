import { fromNodeHeaders } from 'better-auth/node';
import { RequestHandler } from 'express';
import { auth } from '../auth.js';
import User from '../models/userModel.js';
import { Session } from '../models/sessionModel.js';

export const routesProtecter: RequestHandler = async (req, res, next) => {
  const nodeHeaders = fromNodeHeaders(req.headers);
  const session = await auth.api.getSession({
    headers: nodeHeaders,
  });

  if (session) {
    res.locals.user = session.user;
    res.locals.session = session.session;
    return next();
  }

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const rawToken = authHeader.split(' ')[1];

    const dbSession = await Session.findOne({ token: rawToken });

    if (dbSession) {
      if (new Date() > new Date(dbSession.expiresAt)) {
        res.status(401).json({ message: 'Session Expired' });
        return;
      }

      const user = await User.findOne({ _id: dbSession.userId });

      if (user) {
        res.locals.user = user;
        res.locals.session = dbSession;
        return next();
      }
    }
  }

  res.status(401).json({ message: 'Unauthorized' });
};
