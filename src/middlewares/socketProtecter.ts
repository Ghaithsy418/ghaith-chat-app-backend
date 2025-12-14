import { fromNodeHeaders } from 'better-auth/node';
import { Socket } from 'socket.io';
import { auth } from '../auth.js'; // Adjust path
import { Session } from '../models/sessionModel.js'; // Adjust path
import User from '../models/userModel.js'; // Adjust path
import AppError from '../utils/appError.js';

export const socketProtector = async (
  socket: Socket,
  next: (err?: Error) => void
) => {
  try {
    const nodeHeaders = fromNodeHeaders(socket.request.headers);

    const session = await auth.api.getSession({
      headers: nodeHeaders,
    });

    if (session) {
      socket.data.user = session.user;
      socket.data.session = session.session;
      return next();
    }

    const authHeader =
      socket.handshake.auth.token || socket.request.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const rawToken = authHeader.split(' ')[1];

      const dbSession = await Session.findOne({ token: rawToken });

      if (dbSession) {
        if (new Date() > new Date(dbSession.expiresAt)) {
          return next(new AppError('Session Expired', 401));
        }

        const user = await User.findOne({ _id: dbSession.userId });

        if (user) {
          socket.data.user = user;
          socket.data.session = dbSession;
          return next();
        }
      }
    }

    return next(new AppError('Unauthorized', 401));
  } catch (error) {
    console.error('Socket Auth Error:', error);
    return next(new AppError('Internal Authentication Error', 500));
  }
};
