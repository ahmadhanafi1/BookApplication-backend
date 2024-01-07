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

  const book = await Book.findOne({name:req.body.book});
  const user = await User.findOne({ email: req.body.email });
  if (!user) {return next(new AppError('No user found with that ID', 404));}
  if (!book) {return next(new AppError('No book found with that ID', 404));}
  if (user.balance < book.price) {
    return res.status(405).json({
      status: 'fail',
      message: "You don't have enough money in your balance to buy this book"
    })
  }

  const newBook = await Book.findOneAndUpdate({name:req.body.book}, {inStock: book.inStock - 1})
  await User.findOneAndUpdate({email:user.email},{ booksPurchased: [...user.booksPurchased, book.name], balance: (user.balance - book.price)  })
  res.status(202).json({
    status: 'success',
    data: {
      book: newBook,
      userBooks: [...user.booksPurchased, book.name]
    },
  })
 })

 exports.refundBook = catchAsync(async (req, res, next) => {
  
  const book = await Book.findOne({name:req.body.book});
  const user = await User.findOne({ email: req.body.email });

  if (!user) { return next(new AppError('No user found with that ID', 404)) }
  if (!book) { return next(new AppError('No book found with that ID', 404)) }

  const indexToRemove = user.booksPurchased.indexOf(req.body.book) 
  if (indexToRemove === -1) {
    return res.status(405).json({
      status: 'fail',
      message: "You can't refund this book as you didn't buy it"
    })
  }
  user.booksPurchased.splice(indexToRemove, 1)
  const newBook = await Book.findOneAndUpdate({name:req.body.book}, {inStock: book.inStock + 1})
   await User.findOneAndUpdate({ email: user.email }, {
      booksPurchased: user.booksPurchased, balance: (user.balance + book.price)
   })
  res.status(202).json({
    status: 'success',
    data: {
      book: newBook,
      userBooks: user.booksPurchased,
    },
  })
 })

exports.addToCart = catchAsync(async (req, res, next) => { 
  const book = await Book.findOne({name:req.body.book});
  const user = await User.findOne({ email: req.body.email });
  
  if (!user) { return next(new AppError('No user found with that ID', 404)) }
  if (!book) { return next(new AppError('No book found with that ID', 404)) }
  if (book.inStock < 1) { return next(new AppError('Book is out of stock', 400)) }
  
  const newBook = await Book.findOneAndUpdate({ name: req.body.book }, { inStock: book.inStock - 1 })
  const inCart = { bookId: book.id, book: book.name, quantity: 1, price: book.price, imageCover: book.imageCover }
  const bookExists = user.cart.some(entry => entry.bookId === book.id)
  let newUser
  if (bookExists) {
    const newCart = user.cart.map((entry) => {return entry.bookId === inCart.bookId ? { ...entry._doc, quantity: entry._doc.quantity + 1 }: entry})
    newUser = await User.findOneAndUpdate({ email: user.email }, { cart: newCart }, { new: true })
    if (newUser) {
        return res.status(202).json({
          status: 'success',
          data: {
            book: newBook,
            userCart: newCart,
          },
        }) 
    }
  } else {
    newUser = await User.findOneAndUpdate({ email: user.email }, { cart: [...user.cart, inCart] }, {new: true})
    if (newUser) {

      return res.status(202).json({
        status: 'success',
        data: {
          book: newBook,
          userCart: newUser.cart,
        },
      }) 
    }
  }

  res.status(500).json({
    status: 'fail',
    data: {
      message: "fail: internal system error.",
    },
  }) 
})

exports.removeFromCart = catchAsync(async (req, res, next) => {
  
  const book = await Book.findOne({name:req.body.book});
  const user = await User.findOne({ email: req.body.email });
  if (!user) { return next(new AppError('No user found with that ID', 404)) }
  if (!book) { return next(new AppError('No book found with that ID', 404)) }

  const newBook = await Book.findOneAndUpdate({ name: req.body.book }, { inStock: book.inStock + 1 })

  const bookToRemove = user.cart.filter(entry => entry?.bookId === book.id)
  console.log(bookToRemove)
  if (!bookToRemove[0]?.bookId) { return next(new AppError('Book does not exist in cart', 400)) }
  let newCart
  let newUser
  if (bookToRemove[0].quantity > 1) {
    newCart = user.cart.map((entry) => entry.bookId === book.id ? { ...entry._doc, quantity: entry._doc.quantity + -1 }: entry)
    newUser = await User.findOneAndUpdate({ email: user.email }, { cart: newCart }, { new: true })
    if (newUser) {
        return res.status(202).json({
          status: 'success',
          data: {
            book: newBook,
            userCart: newCart,
          },
        }) 
    }
  } else {
    newCart = user.cart.filter(entry => entry.bookId !== book.id)
    newUser = await User.findOneAndUpdate({ email: user.email }, { cart: newCart }, { new: true })
    if (newUser) {
        return res.status(202).json({
          status: 'success',
          data: {
            book: newBook,
            userCart: newCart,
          },
        }) 
    }
  }
})

exports.buyCart = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) { return next(new AppError('No user found with that ID', 404)) }
  const userBalance = user.balance
  let priceToPay = 0
  user.cart.forEach(entry => {priceToPay += entry.price * entry.quantity })
  if (userBalance < priceToPay) return next(new AppError("You don't have enough money in your balance to buy all the items selected", 400))  

  const purchasedBooks = user.cart.map(entry => {
    const today = new Date()
    return {book: entry.book, date: today}
  }) 
  const newUser = await User.findOneAndUpdate({ email: user.email }, { cart: [], balance: userBalance - priceToPay, booksPurchased: purchasedBooks }, {new: true})
  return res.status(202).json({
    status: 'success',
    data: {
      user: newUser,
    },
  })  
}) 
