// Load environment variables from .env (must be early)
require('dotenv').config();

// Add required packages
const express = require("express");
const app = express();

// Add database package and connection string
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    max: 2
});

// Set up EJS
app.set("view engine", "ejs");

// Body parser for form submissions (URL-encoded)
app.use(express.urlencoded({ extended: true }));

// Start listener
app.listen(process.env.PORT || 3000, () => {
    console.log("Server started (http://localhost:3000/) !");
});

// Home page
app.get("/", (req, res) => {
    res.render("index");
});

// List all books
app.get("/books", (req, res) => {
    const sql = "SELECT * FROM BOOKS ORDER BY id";
    pool.query(sql, [], (err, result) => {
        let message = "";
        let model = [];
        if (err) {
            message = `Error - ${err.message}`;
        } else {
            message = "success";
            model = result.rows;
        }
        res.render("data", {
            message: message,
            model: model
        });
    });
});

// Show form to add a new book
app.get("/books/add", (req, res) => {
    // Provide an empty book so _editor.ejs has something to bind to
    const emptyBook = { id: 0, title: "", author: "", comments: "" };
    res.render("add", { model: emptyBook });
});

// Process form to add a new book
app.post("/books/add", (req, res) => {
    const sql = "INSERT INTO BOOKS (title, author, comments) VALUES ($1, $2, $3)";
    const params = [req.body.title, req.body.author, req.body.comments];
    pool.query(sql, params, (err, result) => {
        if (err) {
            return res.send(`Error - ${err.message}`);
        }
        res.redirect("/books");
    });
});

// Show form to edit an existing book
app.get("/books/edit/:id", (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM BOOKS WHERE id = $1";
    pool.query(sql, [id], (err, result) => {
        if (err) {
            return res.send(`Error - ${err.message}`);
        }
        if (result.rows.length === 0) {
            return res.send(`No book found with id ${id}`);
        }
        res.render("edit", { model: result.rows[0] });
    });
});

// Process form to update an existing book
app.post("/books/edit/:id", (req, res) => {
    const id = req.params.id;
    const sql = "UPDATE BOOKS SET title = $1, author = $2, comments = $3 WHERE id = $4";
    const params = [req.body.title, req.body.author, req.body.comments, id];
    pool.query(sql, params, (err, result) => {
        if (err) {
            return res.send(`Error - ${err.message}`);
        }
        res.redirect("/books");
    });
});

// Delete a book
app.post("/books/delete/:id", (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM BOOKS WHERE id = $1";
    pool.query(sql, [id], (err, result) => {
        if (err) {
            return res.send(`Error - ${err.message}`);
        }
        res.redirect("/books");
    });
});
