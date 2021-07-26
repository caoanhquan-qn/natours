const fs = require('fs');

// READ FILES
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`, 'utf-8')
);
exports.getAllTours = (req, res) => {
  res
    .status(200)
    .json({ status: 'success', results: tours.length, data: { tours } });
};

exports.checkId = (req, res, next, val) => {
  const tour = tours.find((tour) => tour.id === Number(val));
  if (!tour) {
    return res.status(404).json({ status: 'fail', message: 'Invalid ID' });
  }
  next();
};
exports.checkTourInfo = (req, res, next) => {
  if (!req.body.name || !req.body.price) {
    return res
      .status(400)
      .json({ status: 'fail', message: 'Invalid Tour Information' });
  }
  next();
};
exports.getTour = (req, res) => {
  const tour = tours.find((tour) => tour.id === Number(req.params.id));
  res.status(200).json({ status: 'success', data: { tour } });
};

exports.createTour = (req, res) => {
  const newId = tours[tours.length - 1].id + 1;
  const newTour = Object.assign({ id: newId }, req.body);
  tours.push(newTour);
  fs.writeFile(
    `${__dirname}/../dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      res.status(201).json({
        status: 'success',
        data: {
          tour: newTour,
        },
      });
    }
  );
};

exports.updateTour = (req, res) => {
  const tour = tours.find((tour) => tour.id === Number(req.params.id));
  const updatedTour = Object.assign({ id: tour.id }, req.body);
  res.status(200).json({ status: 'success', data: { tour: updatedTour } });
};

exports.deleteTour = (req, res) => {
  res.status(204).json({ status: 'success', data: null });
};
