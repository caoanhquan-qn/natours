const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const AppError = require('./utils/appError');
const errorController = require('./controllers/errorController');

const app = express();

// MIDDLEWARES

// MIDDLEWARE 1
app.use(express.json());

// MIDDLEWARE 2
app.use(helmet());

// To remove data, use:
app.use(mongoSanitize());

app.use(xss());
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);
//
app.use(express.static(`${__dirname}/public`));

//
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes
  max: 100,
  message:
    'Too many requests created from this IP. Please try again after an hour',
});

// only apply to requests that begin with /api
app.use('/api', limiter);

// MIDDLEWARE
app.use((req, res, next) => {
  console.log('Hello from my own middleware 👋');
  req.requestTime = new Date().toISOString();
  next();
});

// MIDDLEWARE
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// GLOBAL ERROR HANDLING MIDDLEWARE
app.use(errorController);

// LOAD HOMEPAGE
const loadHomePage = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      message: 'Hello from the server side!',
      app: 'Natours',
      requestTime: req.requestTime,
    },
  });
};

app.get('/', loadHomePage);

// HANDLE UNHANDLED ROUTES
app.all('*', (req, res, next) => {
  const err = new AppError(
    `${req.originalUrl} can't be found on this server ⛔️`,
    404
  );
  next(err);
});

module.exports = app;
