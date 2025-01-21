import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ExpenseTracker.css'; // Import the styles

function ExpenseTracker() {
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
                setNewExpense({
                    date: '',
                    category: '',
                    subcategory: '',
                    amount: '',
                    description: ''
                });
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
        const options = { year: '2-digit', month: '2-digit', day: '2-digit' };
        return new Date(date).toLocaleDateString(undefined, options);
    };

    return (
        <div className="expense-tracker">
            <h2 className="tracker-header">Expense Tracker</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <form onSubmit={handleSubmit} className="expense-form">
                <input
                    type="date"
                    name="date"
                    value={newExpense.date}
                    onChange={handleInputChange}
                    className="form-input"
                />
                <select
                    name="category"
                    value={newExpense.category}
                    onChange={handleInputChange}
                    className="form-input"
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
                    className="form-input"
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
                    className="form-input"
                />
                <input
                    type="text"
                    name="description"
                    placeholder="Description"
                    value={newExpense.description}
                    onChange={handleInputChange}
                    className="form-input"
                />
                <button type="submit" className="submit-btn">Add Expense</button>
            </form>

            <h3 className="expense-list-header">Expense List</h3>
            <table className="expense-table">
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
                            <td>{formatDate(expense.date)}</td>
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

export default ExpenseTracker;
