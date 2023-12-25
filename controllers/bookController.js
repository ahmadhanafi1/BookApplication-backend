const Book = require('../models/bookModel');
const User = require('../models/userModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.aliasTopBooks = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllBooks = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Book.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const books = await features.query;

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: books.length,
    data: {
      books
    }
  });
});

exports.getBook = catchAsync(async (req, res, next) => {
  
  const book = await Book.findById(req.params.id);

  if (!book) {
    return next(new AppError('No book found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      book
    }
  });
});

exports.createBook = catchAsync(async (req, res, next) => {
  const newBook = await Book.create({...req.body, inStock: (Math.random() * 50).toFixed()});
  res.status(201).json({
    status: 'success',
    data: {
      book: newBook
    }
  });
});

exports.updateBook = catchAsync(async (req, res, next) => {
  const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!book) {
    return next(new AppError('No book found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      book
    }
  });
});

exports.deleteBook = catchAsync(async (req, res, next) => {
  const book = await Book.findByIdAndDelete(req.params.id);

  if (!book) {
    return next(new AppError('No book found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.buyBook = catchAsync(async (req, res, next) => {
  const book = await Book.findById(req.body.book);
  const user = await User.findOne({email:req.body.email});
  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }
  if (!book) {
    return next(new AppError('No book found with that ID', 404));
  }
  if (user.balance < book.price) {
    return res.status(405).json({
      status: 'fail',
      message: "You don't have enough money in your balance to buy this book"
    })
  }

  const newBook = await Book.findByIdAndUpdate(req.params.id, {inStock: book.inStock - 1})
  await User.findOneAndUpdate({email:user.email},{ booksPurchased: [...user.booksPurchased, book.name], balance: (user.balance - book.price)  })
  res.status(202).json({
    status: 'success',
    data: {
      book: newBook,
      userBooks: [...user.booksPurchased, book.name]
    },
  })
 })

