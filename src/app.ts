import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import hpp from 'hpp';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import { CREDENTIALS, LOG_FORMAT, NODE_ENV, ORIGIN, PORT, SENTRY_DSN } from './config';
import { Routes } from './interfaces/routes.interface';
import { logger, stream } from './utils/logger';
import loggerMiddleware from './middlewares/logger.middleware';
import errorMiddleware from './middlewares/error.middleware';
import { PrismaClientService } from './services/prisma.service';
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { limiter } from './middlewares/ratelimit.middleware';

class App {
  public app: express.Application;
  public env: string;
  public port: string | number;
  public prismaClient: PrismaClientService;

  constructor(routes: Routes[]) {
    this.app = express();
    this.env = NODE_ENV || 'development';
    this.port = PORT || 3000;
    this.prismaClient = new PrismaClientService();

    this.initializeSentry();
    this.initializeDatabase();
    this.initializeMiddlewares();
    this.initializeRoutes(routes);
    this.initializeErrorHandling();
  }

  public listen() {
    this.app.listen(this.port, () => {
      logger.info(`=================================`);
      logger.info(`======= ENV: ${this.env} =======`);
      logger.info(`🚀 App listening on the port ${this.port}`);
      logger.info(`=================================`);
    });
  }

  public getServer() {
    return this.app;
  }

  private initializeMiddlewares() {
    this.app.use(limiter);
    this.app.use(morgan(LOG_FORMAT, { stream }));
    this.app.use(cors({ origin: ORIGIN.split(' '), credentials: CREDENTIALS }));
    this.app.use(hpp());
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());
    this.app.use(loggerMiddleware);
    this.app.use(Sentry.Handlers.requestHandler());
    this.app.use(Sentry.Handlers.tracingHandler());
  }

  private initializeSentry() {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: this.env,
      integrations: [
        // enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // enable Express.js middleware tracing
        new Sentry.Integrations.Express({ app: this.app }),
        new ProfilingIntegration(),
      ],
      // Performance Monitoring
      tracesSampleRate: 1.0, //  Capture 100% of the transactions
      // Set sampling rate for profiling - this is relative to tracesSampleRate
      profilesSampleRate: 1.0,
      // Enable debug mode to log event processing
      debug: this.env === 'development',
      enabled: this.env === 'production',
    });
  }

  private initializeDatabase() {
    this.prismaClient.initializePrisma();
  }

  private initializeRoutes(routes: Routes[]) {
    routes.forEach(route => {
      this.app.use('/', route.router);
    });
  }

  private initializeErrorHandling() {
    this.app.use(Sentry.Handlers.errorHandler());
    this.app.use(errorMiddleware);
  }
}

export default App;
