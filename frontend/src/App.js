import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
    const [expenses, setExpenses] = useState([]);
    const [newExpense, setNewExpense] = useState({
        date: '',
        category: '',
        subcategory: '',
        amount: '',
        description: ''
    });
    const [categories] = useState(['Needs', 'Wants', 'Savings']);
    const [subcategories] = useState([
        'Travel',
        'Subscriptions',
        'Eating Out',
        'Groceries',
        'Needs',
        'Activities'
    ]);
    const [error, setError] = useState('');

    useEffect(() => {
        axios.get('http://localhost:5000/expenses')
            .then(res => {
                setExpenses(res.data);
            })
            .catch(err => console.log(err));
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewExpense(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        axios.post('http://localhost:5000/expenses', newExpense)
            .then(res => {
                setExpenses([...expenses, res.data]);

            })
            .catch(err => {
                if (err.response && err.response.data && err.response.data.error) {
                    setError(err.response.data.error);
                } else {
                    console.error(err);
                }
            });
    };

    const handleDelete = (id) => {
        axios.delete(`http://localhost:5000/expenses/${id}`)
            .then(res => {
                setExpenses(expenses.filter(expense => expense.id !== id));
            })
            .catch(err => {
                console.error(err);
            });
    };

    const formatDate = (date) => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0'); // Adds leading 0 if day < 10
        const month = String(d.getMonth() + 1).padStart(2, '0'); // Adds leading 0 if month < 10
        const year = String(d.getFullYear()).slice(-2); // Get last two digits of the year
        return `${month}/${day}/${year}`;
    };

    return (
        <div>
            <h1>Expense Tracker</h1>
            {error && <p className="error">{error}</p>}
            
            <form onSubmit={handleSubmit}>
                <input
                    type="date"
                    name="date"
                    value={newExpense.date}
                    onChange={handleInputChange}
                />
                <select
                    name="category"
                    value={newExpense.category}
                    onChange={handleInputChange}
                >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                    ))}
                </select>

                <select
                    name="subcategory"
                    value={newExpense.subcategory}
                    onChange={handleInputChange}
                >
                    <option value="">Select Subcategory</option>
                    {subcategories.map(subcategory => (
                        <option key={subcategory} value={subcategory}>{subcategory}</option>
                    ))}
                </select>

                <input
                    type="number"
                    name="amount"
                    placeholder="Amount"
                    value={newExpense.amount}
                    onChange={handleInputChange}
                />
                <input
                    type="text"
                    name="description"
                    placeholder="Description"
                    value={newExpense.description}
                    onChange={handleInputChange}
                />
                <button type="submit">Add Expense</button>
            </form>

            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Category</th>
                        <th>Subcategory</th>
                        <th>Amount</th>
                        <th>Description</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {expenses.map(expense => (
                        <tr key={expense.id}>
                            <td>{formatDate(expense.date)}</td> {/* Format the date here */}
                            <td>{expense.category}</td>
                            <td>{expense.subcategory}</td>
                            <td>${expense.amount}</td>
                            <td>{expense.description}</td>
                            <td>
                                <button className="delete-btn" onClick={() => handleDelete(expense.id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default App;
