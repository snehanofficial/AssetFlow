import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import loggerMiddleware from './middlewares/logging.middleware.js';
import errorHandler from './middlewares/error.middleware.js';
import apiRouter from './routes/index.js';

const app = express();

// Security headers
app.use(helmet());

// CORS configuration (allow requests from the frontend client port/origin)
app.use(
  cors({
    origin: true, // In local development, dynamic check. Can be configured to VITE_API_URL matching client
    credentials: true,
  })
);

// Standard parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
app.use(morgan('dev'));
app.use(loggerMiddleware);

// Static uploads serving (for local file storage driver)
app.use('/static-uploads', express.static('uploads'));

// Central routes mounting
app.use('/api/v1', apiRouter);

// Fallback 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
    },
  });
});
//global error handler - for error and exception in server.
app.use(errorHandler);

export default app;
