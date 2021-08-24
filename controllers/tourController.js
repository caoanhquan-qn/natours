const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
// const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const {
  createFactoryFunction,
  getFactoryFunction,
  updateFactoryFunction,
  deleteFactoryFunction,
} = require('./handlerFactory');

// HANDLER FUNCTIONS

exports.getAllTours = catchAsync(async (req, res) => {
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .fields();
  // .paginate();

  // EXECUTE QUERY
  const tours = await features.query;

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
});

exports.getTour = getFactoryFunction(Tour, 'tour');
exports.createTour = createFactoryFunction(Tour, 'tour');
exports.updateTour = updateFactoryFunction(Tour, 'tour');
exports.deleteTour = deleteFactoryFunction(Tour);

exports.aliasTopTours = (req, res, next) => {
  req.query = {
    sort: '-ratingsAverage,price',
    limit: 5,
    fields: 'name,price,ratingsAverage,summary,difficulty',
  };
  next();
};
exports.getTourStats = async (req, res) => {
  try {
    const stats = await Tour.aggregate([
      { $match: { ratingsAverage: { $gte: 4.5 } } },
      {
        $group: {
          _id: '$difficulty',
          numTours: { $sum: 1 },
          numRatings: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      { $sort: { avgPrice: 1 } },
      // { $match: { _id: { $ne: 'easy' } } },
    ]);
    res.status(200).json({
      status: 'success',
      data: {
        stats,
      },
    });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};

exports.getMonthlyPlan = async (req, res) => {
  try {
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
      { $unwind: '$startDates' },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numTours: { $sum: 1 },
          tours: { $push: '$name' },
        },
      },
      { $addFields: { month: '$_id' } },
      {
        $project: {
          _id: 0,
        },
      },
      {
        $sort: {
          numTours: -1,
        },
      },
      { $limit: 12 },
    ]);
    res.status(200).json({
      status: 'success',
      results: plan.length,
      data: {
        plan,
      },
    });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};
