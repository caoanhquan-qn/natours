const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const User = require('../models/userModel');
const {
  createFactoryFunction,
  getFactoryFunction,
  updateFactoryFunction,
  deleteFactoryFunction,
} = require('./handlerFactory');

const filterObject = (obj, ...allowedFields) => {
  let filteredObject = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      filteredObject[el] = obj[el];
    }
  });

  return filteredObject;
};

// HTTP verb requests
exports.createUser = createFactoryFunction(User, 'user');
exports.getUser = getFactoryFunction(User, 'user');
exports.updateUser = updateFactoryFunction(User, 'user');
exports.deleteUser = deleteFactoryFunction(User);

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const apiFeatures = new APIFeatures(User.find(), req.query).fields();
  const users = await apiFeatures.query;
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1. Create an error if user POSTs an password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password update. Please use /updateMyPassword',
        400
      )
    );
  }
  // 2. Filter out req.body

  const filteredBody = filterObject(req.body, 'name', 'email');

  // 3. Update Me

  const updatedMyProfile = await User.findByIdAndUpdate(
    req.user._id,
    filteredBody,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedMyProfile,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
