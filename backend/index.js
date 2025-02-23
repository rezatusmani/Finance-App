const express = require('express');
const multer = require('multer');
const Papa = require('papaparse');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();

// Add the express.json() middleware to parse JSON requests
app.use(express.json());

// Allow all origins
app.use(cors());

// Database connection
const pool = new Pool({
    user: 'reza',
    host: 'localhost',
    database: 'expense_tracker',
    password: 'rezasfinances',
    port: 5432,
});

// Setup file upload using multer
const upload = multer({ dest: 'uploads/' });

// Fetch all expenses, sorted by transaction date
app.get('/expenses', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM expenses ORDER BY date DESC');
        res.json(result.rows);  // Send back all the rows as JSON
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ error: 'Unable to fetch expenses' });
    }
});

// Endpoint for file upload
app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const { account } = req.body; // Extract account from request

    if (!account) {
        return res.status(400).json({ error: 'Account selection is required' });
    }

    try {
        const filePath = path.join(__dirname, 'uploads', req.file.filename);
        const fileContent = fs.readFileSync(filePath, 'utf8');

        Papa.parse(fileContent, {
            header: true,
            dynamicTyping: true,
            complete: async (results) => {
                const parsedData = results.data;
                const expenses = parsedData.map(row => {
                    if (!row['Description'] || !row['Amount'] || !row['Transaction Date']) {
                        return null;
                    }
                    return {
                        date: row['Transaction Date'],
                        amount: row['Amount'],
                        category: row['Category'] || 'Payment',
                        subcategory: row['Subcategory'] ||
                            (row['Category'] === 'Food & Drink' ? 'Wants' :
                            row['Category'] === 'Entertainment' ? 'Wants' :
                            row['Category'] === 'Groceries' ? 'Needs' :
                            row['Category'] === 'Gas' ? 'Needs' :
                            row['Category'] === 'Home' ? 'Needs' :
                            row['Category'] === 'Health & Wellness' ? 'Needs' :
                            row['Category'] === 'Automotive' ? 'Needs' :
                            'Unselected'),
                        description: row['Description'],
                        account: account // Add selected account
                    };
                }).filter(expense => expense !== null);

                if (expenses.length > 0) {
                    await saveToDatabase(expenses);
                    res.status(200).json(expenses);
                } else {
                    res.status(400).json({ error: 'No valid expenses found to insert' });
                }
            },
            error: (error) => {
                console.error('CSV Parsing Error:', error);
                res.status(500).json({ error: 'Error parsing the CSV file' });
            }
        });
    } catch (err) {
        console.error('Error processing file:', err);
        res.status(500).json({ error: 'Error processing file' });
    }
});

// Save expenses to the database
const saveToDatabase = async (expenses) => {
    const query = 'INSERT INTO expenses (amount, category, subcategory, date, description, notes, account) VALUES ($1, $2, $3, $4, $5, $6, $7)';

    for (const expense of expenses) {
        try {
            const checkQuery = 'SELECT * FROM expenses WHERE amount = $1 AND date = $2 AND description = $3';
            const result = await pool.query(checkQuery, [
                expense.amount, 
                expense.date,
                expense.description
            ]);

            if (result.rows.length === 0) {
                await pool.query(query, [
                    expense.amount, 
                    expense.category,
                    expense.subcategory,
                    expense.date,
                    expense.description,
                    expense.notes || '',  // Default to empty string if no notes
                    expense.account,
                ]);
            }
        } catch (error) {
            console.error('Error inserting expense:', error);
        }
    }
};

// PUT route to update any field of an expense
app.put('/expenses/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body; // Ensure the request body contains fields to update

    if (Object.keys(updates).length === 0) {
        return res.status(400).send('No fields provided for update');
    }

    const fields = Object.keys(updates);
    const values = Object.values(updates);

    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    values.push(id); // Add id as the last parameter for WHERE clause

    try {
        const result = await pool.query(
            `UPDATE expenses SET ${setClause} WHERE id = $${values.length} RETURNING *`,
            values
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating expense');
    }
});

app.listen(5000, () => {
    console.log('Server running on http://localhost:5000');
});
