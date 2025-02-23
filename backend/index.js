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

    try {
        const filePath = path.join(__dirname, 'uploads', req.file.filename);
        const fileContent = fs.readFileSync(filePath, 'utf8');

        Papa.parse(fileContent, {
            header: true,
            dynamicTyping: true,
            complete: async (results) => {
                const parsedData = results.data;
                const expenses = parsedData.map(row => {
                    if (!row['Category']) {
                        return null;
                    }
                    return {
                        date: row['Transaction Date'],
                        amount: row['Amount'],
                        category: row['Category'],
                        subcategory: row['Subcategory'] ||
                            category === 'Food & Drink' ? 'Wants' :
                            category === 'Entertainment' ? 'Wants' :
                            category === 'Groceries' ? 'Needs' :
                            category === 'Gas' ? 'Needs' :
                            category === 'Home' ? 'Needs' :
                            category === 'Health & Wellness' ? 'Needs' :
                            category === 'Automotive' ? 'Needs' :
                        'Unselected',
                        description: row['Description'],
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
    const query = 'INSERT INTO expenses (amount, category, subcategory, date, description, notes) VALUES ($1, $2, $3, $4, $5, $6)';

    for (const expense of expenses) {
        try {
            // Ensure the amount is positive
            const positiveAmount = Math.abs(expense.amount);

            const checkQuery = 'SELECT * FROM expenses WHERE amount = $1 AND date = $2 AND description = $3';
            const result = await pool.query(checkQuery, [
                positiveAmount, // Use the positive amount
                expense.date,
                expense.description
            ]);

            if (result.rows.length === 0) {
                await pool.query(query, [
                    positiveAmount, // Use the positive amount
                    expense.category,
                    expense.subcategory,
                    expense.date,
                    expense.description,
                    expense.notes || '',  // Default to empty string if no notes
                ]);
            } else {
                console.log('Duplicate found, skipping:', expense);
            }
        } catch (error) {
            console.error('Error inserting expense:', error);
        }
    }
};


// PUT route to update notes
app.put('/expenses/:id', async (req, res) => {
    const { id } = req.params;
    const { notes } = req.body; // Ensure 'notes' is sent in the body

    if (notes === undefined) {
        return res.status(400).send('Notes field is missing');
    }

    try {
        const result = await pool.query(
            'UPDATE expenses SET notes = $1 WHERE id = $2 RETURNING *',
            [notes, id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating notes');
    }
});

app.listen(5000, () => {
    console.log('Server running on http://localhost:5000');
});
