const express = require('express');

const reviewRouter = express.Router({ mergeParams: true });

const {
  getAllReviews,
  getReview,
  createReview,
  deleteReview,
  updateReview,
} = require('../controllers/reviewController');
const { protect, restrictTo } = require('../controllers/authController');

reviewRouter
  .route('/')
  .get(getAllReviews)
  .post(protect, restrictTo('user'), createReview);

reviewRouter
  .route('/:id')
  .get(getReview)
  .patch(protect, updateReview)
  .delete(protect, restrictTo('user', 'admin'), deleteReview);

module.exports = reviewRouter;
