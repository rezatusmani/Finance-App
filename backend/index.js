const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const Joi = require('joi');
require('dotenv').config();
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

// Initialize the app
const app = express();

// Enable CORS for all origins (you can limit to specific origins if needed)
app.use(cors());

// Middleware for setting custom headers (if needed)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins, or specify the frontend origin ('http://localhost:3000')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// Log environment variables to confirm they are loaded
console.log(process.env.PLAID_CLIENT_ID);
console.log(process.env.PLAID_SECRET);
console.log(process.env.PLAID_ENV);

// Database connection
const pool = new Pool({
    user: 'reza',
    host: 'localhost',
    database: 'expense_tracker',
    password: 'rezasfinances',
    port: 5432,
});

//#region Third-Party services like databases or APIs

// Configure Plaid client
const configuration = new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV],
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
            'PLAID-SECRET': process.env.PLAID_SECRET,
        },
    },
});
const plaidClient = new PlaidApi(configuration);

// Route to get transactions using Plaid API
app.get('/transactions', async (req, res) => {
    try {
        const accessToken = req.query.access_token;  // You'd get this token after the public token exchange step
        const response = await plaidClient.transactionsGet({
            access_token: accessToken,
            start_date: '2023-01-01',
            end_date: '2025-01-27',
        });

        const transactions = response.data.transactions;
        res.json(transactions);  // Send the transactions back to the frontend
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching transactions');
    }
});

// Route to exchange public token for access token
app.post('/exchange_public_token', async (req, res) => {
    try {
        const { public_token } = req.body;
        const response = await plaidClient.itemPublicTokenExchange({ public_token });
        const accessToken = response.data.access_token;
        const itemId = response.data.item_id;

        // Store the access token and item ID securely
        res.json({ accessToken, itemId });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error exchanging public token');
    }
});

//#endregion

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
