const express = require('express');
const bookController = require('./../controllers/bookController');
const authController = require('../controllers/authController');

const router = express.Router();

// router.param('id', bookController.checkID);

router
  .route('/top-5-cheap')
  .get(bookController.aliasTopBooks, bookController.getAllBooks);

router
  .route('/buy')
  .post(bookController.buyBook)

router
  .route('/refund')
  .post(bookController.refundBook)

router
  .route('/')
  .get(authController.protect, bookController.getAllBooks)
  .post(bookController.createBook);

router
  .route('/:id')
  .get(bookController.getBook)
  .patch(bookController.updateBook)
  .delete(
    // authController.protect,
    // authController.restrictTo('admin'),
    bookController.deleteBook
);
  


module.exports = router;
