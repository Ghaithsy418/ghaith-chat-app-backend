import cors from 'cors';
import express, { Express } from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import AuthController from './controllers/authController.js';
import ChatController from './controllers/chatController.js';
import UserController from './controllers/userController.js';
import { globalErrorHandler } from './middlewares/globalErrorHandler.js';
import AppError from './utils/appError.js';
import { createRouterForController } from './utils/decorators/createRouter.js';

export const app: Express = express();

app.set('trust proxy', true);
app.use(helmet());

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'You have sent many requests, Please send requests again later!',
  validate: { trustProxy: false },
});
app.use('/api', limiter);

app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(import.meta.dirname, '../public')));
app.use(
  cors({
    origin: ['http://localhost:3001'],
    credentials: true,
  })
);
app.use(mongoSanitize());

// Routes

const authRouter = createRouterForController(AuthController);
const userRouter = createRouterForController(UserController);
const chatRouter = createRouterForController(ChatController);

app.use(authRouter);
app.use(userRouter);
app.use(chatRouter);

app.all('*', (req, _res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} in this app`, 404));
});

app.use(globalErrorHandler);
