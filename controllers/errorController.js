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
    if (err.name === 'CastError') {
      const castError = handleCastError(err);
      sendErrorProd(castError, res);
    } else if (err.code === 11000) {
      const duplicateKeyError = handleDuplicateKeyError(err);
      sendErrorProd(duplicateKeyError, res);
    } else if (err.name === 'ValidationError') {
      const validationError = handleValidationError(err);
      sendErrorProd(validationError, res);
    } else {
      sendErrorProd(err, res);
    }
  }
};
