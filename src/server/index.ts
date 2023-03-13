import dotenv from 'dotenv';
import http from 'http';
import mongoose from 'mongoose';

import app from '../app';
import AppError from '../errorService/utils/AppErrorModule';
dotenv.config();
// get db credentials from config env file
const DB =
  process.env.DATABASE?.replace(
    '<password>',
    `${process.env.DATABASE_PASSWORD}`
  ) ?? '';

const mongooseConnect = mongoose.connect(DB);

mongooseConnect.then(() => {
  console.log('DB CONNECTED');
});
const starq = http.createServer(app);
const port = Number(`${process.env.PORT}`) || 7100;

const server = starq.listen(port, () => {
  `server running on port: ${port}`;
});

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION...shutting down...');
  console.log(err.name, err.message);
  console.log('unhandledRejection...shutting down...');
  //handle pending   before closing server
  // here we must really crash the application because after uncaught exception the entire node process is in an unclean state and needs a refresh requests
  server.close(() => {
    process.exit(1);
  });
});

process.on('unhandledRejection', (err) => {
  if (err instanceof AppError) console.log(err.name);
  console.log(
    '...........................................................................................................................'
  );
  console.log(err);
  console.log('UNHANDLED REJECTION ...shutting down...');
  //handle pending requests before closing server.. crashing the app here is optional
  server.close(() => {
    process.exitCode = 1;
  });
});

process.on('SIGTERM', () => {
  console.log('sigterm recieved shutting down gracefully 😴');
  server.close(() => {
    console.log(' Process Terminated 🤯');
  });
});
