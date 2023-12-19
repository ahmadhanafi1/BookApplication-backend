const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');


const bookSchema = new mongoose.Schema({
	name: {
    type: String,
    required: [true, 'A book must have a name'],
    unique: true,
    trim: true,
    maxlength: [40, 'A book name must have less or equal then 40 characters'],
    minlength: [10, 'A book name must have more or equal then 10 characters']
	},
	slug: String,
	author: {
	  type: String,
	  required: [true, "A book author must be provided"],
	},
	genre: {
		type: String,
		required: [true, "A book genre must be provided"],
	  },
	price: {
	  type: Number,
	  required: [true, "A book price must be provided"],
	},
	publishYear: {
	  type: Number,
	  required: [true, "A book publish year must be provided"],
	},
	rating: {
    type: Number,
    default: 4.5,
    min: [1, 'Rating must be above 1.0'],
    max: [5, 'Rating must be below 5.0']
  },
  
  description: {
    type: String,
    trim: true
  },
  imageCover: {
    type: String,
    // required: [true, 'A book must have a cover image']
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false
  },
  startDates: [Date],
  secretBook: {
    type: Boolean,
    default: false
  }
},
{
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})
  

bookSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
bookSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// QUERY MIDDLEWARE
// bookSchema.pre('find', function(next) {
bookSchema.pre(/^find/, function(next) {
  this.find({ secretBook: { $ne: true } });
  this.start = Date.now();
  next();
});

bookSchema.post(/^find/, function(docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  next();
});

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;
