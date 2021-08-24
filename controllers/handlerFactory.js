const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// FACTORY FUNCTION
exports.createFactoryFunction = (Model, typeOfData = 'data') =>
  catchAsync(async (req, res, next) => {
    if (typeOfData === 'review') {
      req.body = {
        review: req.body.review,
        rating: req.body.rating,
        tourId: req.params.tourId ? req.params.tourId : req.body.tourId,
        userId: req.user._id,
      };
    }
    const newOne = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        [typeOfData]: newOne,
      },
    });
  });

exports.getFactoryFunction = (Model, typeOfData = 'data') =>
  catchAsync(async (req, res, next) => {
    // Tour.findOne({_id: req.params.id})
    const doc = await Model.findById(req.params.id).populate({
      path: 'reviews',
      select: 'review rating -tourId',
    });
    if (!doc) {
      throw new AppError(`${req.originalUrl} can't be found ⛔️`, 404);
    }
    res.status(200).json({
      status: 'success',
      data: {
        [typeOfData]: doc,
      },
    });
  });

exports.updateFactoryFunction = (Model, typeOfData = 'data') =>
  catchAsync(async (req, res, next) => {
    let updatedOne;
    if (typeOfData === 'review') {
      updatedOne = await Model.findById(req.params.id).findOneAndUpdate(
        { userId: req.user._id },
        req.body,
        { new: true, runValidators: true }
      );
    } else {
      updatedOne = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
    }
    if (!updatedOne) {
      throw new AppError(`${req.originalUrl} can't be found ⛔️`, 404);
    }
    res.status(200).json({
      status: 'success',
      data: {
        [typeOfData]: updatedOne,
      },
    });
  });

exports.deleteFactoryFunction = (Model) =>
  catchAsync(async (req, res, next) => {
    const deletedOne = await Model.findByIdAndDelete(req.params.id);
    if (!deletedOne) {
      throw new AppError(`${req.originalUrl} can't be found ⛔️`, 404);
    }
    res.status(204).json({ status: 'success', data: null });
  });
