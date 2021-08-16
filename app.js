const express = require('express');
const morgan = require('morgan');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError');
const errorController = require('./controllers/errorController');

const app = express();

// MIDDLEWARES

// MIDDLEWARE 1
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// MIDDLEWARE 2
app.use(express.json());

// MIDDLEWARE 3
app.use((req, res, next) => {
  console.log('Hello from the middleware 👋');
  next();
});

//
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//
app.use(express.static(`${__dirname}/public`));

//
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

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
