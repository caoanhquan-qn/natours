const Review = require('../models/reviewModel');
const APIFeatures = require('../utils/apiFeatures');
// const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const {
  createFactoryFunction,
  getFactoryFunction,
  updateFactoryFunction,
  deleteFactoryFunction,
} = require('./handlerFactory');

exports.createReview = createFactoryFunction(Review, 'review');
exports.getReview = getFactoryFunction(Review, 'review');
exports.updateReview = updateFactoryFunction(Review, 'review');
exports.deleteReview = deleteFactoryFunction(Review);

exports.getAllReviews = catchAsync(async (req, res) => {
  let features;
  if (req.params.tourId) {
    features = new APIFeatures(
      Review.find({ tourId: req.params.tourId }),
      req.query
    );
  } else {
    features = new APIFeatures(Review.find(), req.query);
  }
  const reviews = await features.query;

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
  });
});
