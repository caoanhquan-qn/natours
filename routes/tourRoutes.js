const express = require('express');
const router = express.Router();
const {
  getAllTours,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  checkId,
  checkTourInfo,
} = require('../controllers/tourController');

router.param('id', checkId);
router.route('/').get(getAllTours).post(checkTourInfo, createTour);
router.route('/:id').get(getTour).patch(updateTour).delete(deleteTour);

module.exports = router;
