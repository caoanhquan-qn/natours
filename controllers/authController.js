const util = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/sendEmail');

const signToken = (id) =>
  jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: new Date().toISOString(),
  });

  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token: token,
    data: {
      user: newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // 2. Check if user exists && password is correct
  const user = await User.findOne({ email: email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect Email or Password', 401));
  }

  // 3. If everything is ok, send token to client
  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token: token,
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1. Getting token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in. Please log in to get access', 401)
    );
  }

  // 2. Verify token
  const decoded = await util.promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );

  // 3. Check if user still exists
  const foundUser = await User.findById(decoded.id);
  if (!foundUser) {
    return next(
      new AppError('The user belonging to this token does no longer exist', 401)
    );
  }

  // 4. Check if user changed password after the token is issued
  const changedPasswordAfter = foundUser.changedPasswordAfter(decoded.iat);

  if (changedPasswordAfter) {
    return next(
      new AppError(
        'User has changed password recently. Please log in again',
        401
      )
    );
  }
  req.user = foundUser;
  next();
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      // forbidden
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on POSTed email

  const foundUser = await User.findOne({ email: req.body.email });
  if (!foundUser) {
    return next(new AppError('There is no user with this email address', 404));
  }
  // 2. Generate the random reset token

  const resetToken = foundUser.createPasswordResetToken();
  await foundUser.save({ validateBeforeSave: false });

  // 3. Send it to user's email

  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}\nIf you don't forget your password, please ignore this email.`;

  try {
    await sendEmail({
      email: foundUser.email,
      subject: 'Your password reset token (valid for 10 mins)',
      message: message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email address',
    });
  } catch (err) {
    foundUser.passwordResetToken = undefined;
    foundUser.passwordResetExpiry = undefined;
    await foundUser.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There is an error in sending the email. Please try again later',
        500
      )
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on the token
  const { token } = req.params;
  const encryptedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const foundUser = await User.findOne({
    passwordResetToken: encryptedToken,
  }).select('+password');

  // 2. If token has not expired and there is an user, set the new password
  if (!foundUser || !(foundUser.passwordResetExpiry.getTime() > Date.now())) {
    return next(new AppError('User does not exist or an expired token', 401));
  }
  foundUser.password = req.body.password;
  foundUser.passwordConfirm = req.body.passwordConfirm;

  // 3. Update passwordChangedAt property for the user
  foundUser.passwordResetToken = undefined;
  foundUser.passwordResetExpiry = undefined;
  await foundUser.save();

  // 4. Log the user in, send JWT
  const jwtToken = signToken(foundUser._id);
  res.status(200).json({
    status: 'success',
    token: jwtToken,
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const foundUser = await User.findById(req.user._id).select('+password');
  if (!foundUser) {
    return next(new AppError('User does not exist', 401));
  }

  // 2) Check if PATCHed current password is correct
  const correctPassword = await foundUser.correctPassword(
    req.body.passwordCurrent,
    foundUser.password
  );
  if (!correctPassword) {
    return next(new AppError('Your current password is wrong', 401));
  }
  // 3) If so, update password
  foundUser.password = req.body.password;
  foundUser.passwordConfirm = req.body.passwordConfirm;
  await foundUser.save();

  // 4)Log user in, send JWT
  const jwtToken = signToken(foundUser._id);
  res.status(200).json({
    status: 'success',
    token: jwtToken,
    data: {
      user: foundUser,
    },
  });
});
