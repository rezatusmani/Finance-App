const { Pool } = require('pg');
const Joi = require('joi');
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Initialize the app
const app = express();

app.use(cors()); // Allow frontend requests
app.use(express.json()); // << This is important to parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // << Add this to support URL-encoded requests

// Middleware for setting custom headers (if needed)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins, or specify the frontend origin ('http://localhost:3000')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// Log environment variables to confirm they are loaded
console.log(process.env.PLAID_CLIENT_ID);  // No longer needed, can be removed

// Database connection
const pool = new Pool({
    user: 'reza',
    host: 'localhost',
    database: 'expense_tracker',
    password: 'rezasfinances',
    port: 5432,
});

// Joi schema for validating expenses
const expenseSchema = Joi.object({
    date: Joi.string().isoDate().required(), // Ensures the date is in ISO format
    category: Joi.string().valid('Needs', 'Wants', 'Savings').required(),
    subcategory: Joi.string().valid('Travel', 'Subscriptions', 'Eating Out', 'Groceries', 'Needs', 'Activities').required(),
    amount: Joi.number().positive().required(),
    description: Joi.string().allow('').optional(),
});

// Middleware for validating request body
const validateExpense = (req, res, next) => {
    const { error } = expenseSchema.validate(req.body);
    if (error) {
        // Return 400 Bad Request with validation error message
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};

// Middleware to parse JSON bodies
app.use(express.json());

// Route to get all expenses
app.get('/expenses', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM expenses');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

// Route to create a new expense
app.post('/expenses', validateExpense, async (req, res) => {
    const { date, category, subcategory, amount, description } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO expenses (date, category, subcategory, amount, description) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`, // Retrieve all columns, including the auto-generated id
            [date, category, subcategory, amount, description]
        );
        res.status(201).json(result.rows[0]); // Respond with the inserted expense
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

// Route to delete an expense by id
app.delete('/expenses/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM expenses WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) {
            return res.status(404).send('Expense not found');
        }
        res.status(200).json({ message: 'Expense deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

// Global error handler (optional)
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start the server
app.listen(5000, () => {
    console.log('Server is running on port 5000');
});
