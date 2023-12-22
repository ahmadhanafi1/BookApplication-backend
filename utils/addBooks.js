// const { books } = require("../data/books.json")
const fs = require('fs').promises
const Book = require('../models/bookModel');

module.exports = async () => {
	const bigD = await fs.readFile("/home/ahmadhanafi/Documents/github/GradProject-backend/utils/books.json", "utf8", (error, data) => {
		if (error) {
			console.log(error)
			return
		}
		return JSON.parse(data)
	});
	const { books } = JSON.parse(bigD)
	
	try {
	books.forEach(async (book) => {
		if (book.cover) {
			await Book.create({
			name: book.title,
			author: book.author,
			genre: book.categories ? book.categories.split(",") : ['uncategorized'],
			price: 20 + Number((Math.random() * 50).toFixed()),
			publishYear: 2003 + Number((Math.random() * 20).toFixed()),
			rating: 1 + Number((Math.random() * 4)),
			description: book.description,
			imageCover: book.cover,

		});}
		
	});
	} catch (err) {
		console.log(err)
	}
}
