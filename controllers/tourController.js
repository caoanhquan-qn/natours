const Tour = require('../models/tourModel');

// HANDLER FUNCTIONS
exports.getAllTours = async (req, res) => {
  try {
    // BUILD QUERY
    let queryObj = Object.assign({}, req.query);
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // ADVANCED FILTERING
    const queryStr = JSON.stringify(queryObj);
    queryObj = JSON.parse(
      queryStr.replace(/\b(gte|gt|lt|lte)\b/g, (match) => `$${match}`)
    );

    const query = Tour.find(queryObj);

    // SORTING
    if (Object.prototype.hasOwnProperty.call(req.query, 'sort')) {
      const sortBy = req.query.sort.split(',').join(' ');
      query.sort(sortBy);
    } else {
      query.sort('-createdAt');
    }

    // FIELDS LIMITING
    if (Object.prototype.hasOwnProperty.call(req.query, 'fields')) {
      const fieldsBy = req.query.fields.split(',').join(' ');
      query.select(fieldsBy);
    } else {
      query.select('-__v');
    }

    // PAGINATION

    const limit = Number(req.query.limit) || 5;
    const currentPage = Number(req.query.page) || 1;
    const numOfPageSkip = currentPage - 1;
    const numOfDocumentSkip = numOfPageSkip * limit;
    query.skip(numOfDocumentSkip).limit(limit);

    if (Object.prototype.hasOwnProperty.call(req.query, 'page')) {
      const numTours = await Tour.countDocuments();
      if (numOfDocumentSkip >= numTours)
        throw new Error('This page does not exist');
    }

    // EXECUTE QUERY
    const tours = await query;

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours,
      },
    });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};

exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    // Tour.findOne({_id: req.params.id})

    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};

exports.createTour = async (req, res) => {
  try {
    const newTour = await Tour.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour,
      },
    });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      status: 'success',
      data: {
        tour: updatedTour,
      },
    });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);
    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};
exports.aliasTopTours = (req, res, next) => {
  req.query = {
    sort: '-ratingsAverage,price',
    limit: 5,
    fields: 'name,price,ratingsAverage,summary,difficulty',
  };
  next();
};
