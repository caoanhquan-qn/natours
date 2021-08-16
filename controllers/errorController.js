const AppError = require('../utils/appError');

const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateKeyError = (err) => {
  const message = `Duplicate key value: "${err.keyValue.name}". Please use another value`;
  return new AppError(message, 400);
};

const handleValidationError = (err) => {
  const value = Object.values(err.errors)
    .map((el) => el.message)
    .join('. ');
  const message = `Invalid Input. ${value}`;
  return new AppError(message, 400);
};

/* eslint-disable */
const handleJsonWebTokenError = (err) =>
  new AppError('Invalid Token. Please log in again', 401);

const handleTokenExpiredError = (err) =>
  new AppError('Your token has expired. Please log in again', 401);

/* eslint-enable */
const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = Object.assign({}, err);
    if (err.name === 'CastError') {
      error = handleCastError(err);
    } else if (err.code === 11000) {
      error = handleDuplicateKeyError(err);
    } else if (err.name === 'ValidationError') {
      error = handleValidationError(err);
    } else if (err.name === 'JsonWebTokenError') {
      error = handleJsonWebTokenError(err);
    } else if (err.name === 'TokenExpiredError') {
      error = handleTokenExpiredError(err);
    }
    sendErrorProd(error, res);
  }
};
