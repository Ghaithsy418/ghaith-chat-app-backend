import { createServer } from 'http';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import { app } from './app.js';
import { socketProtector } from './middlewares/socketProtecter.js';
import { Message } from './models/messageModel.js';

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION!');
  console.log(err);
  process.exit(1);
});

const port = process.env.PORT || 3000;

const server = createServer(app);

mongoose
  .connect(process.env.DATABASE_LOCAL || '')
  .then(() => console.log('Successfully connected to database'));

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

io.use(socketProtector);

io.on('connection', (socket) => {
  const { user } = socket.data;

  console.log(`User ${user?.username} connected via Socket!`);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${user?.username} joined room: ${roomId}`);
  });

  socket.on('send_message', async (data) => {
    try {
      const chatRoomId = new mongoose.Types.ObjectId(data.chatRoomId);
      const sender = new mongoose.Types.ObjectId(data.sender);

      const newMessage = await Message.create({
        chatRoomId,
        sender,
        content: data.content,
      });

      await newMessage.populate(
        'sender',
        'firstName middleName lastName image'
      );

      io.to(data.chatRoomId).emit('receive_message', newMessage);
    } catch (err) {
      console.error('Error saving message: ', err);
      socket.emit('error', 'Message could not be sent.');
    }
  });

  socket.on('disconnect', () => {
    console.log(`User ${user?.username} Disconnected`);
  });
});

server.listen(port, () => {
  console.log(`Chat App is running at http://localhost:${port}`);
});

process.on('unhandledRejection', (err: Error) => {
  console.log('UNHANDLED REJECTION!');
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});
