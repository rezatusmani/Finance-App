import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SpendingSummary.css';

// Function to format date as M/D/YY
const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1; // getMonth() returns 0-11, so add 1
    const day = date.getDate();
    const year = date.getFullYear().toString().slice(-2); // Get the last 2 digits of the year
    return `${month}/${day}/${year}`;
};

// Decode HTML entities
const decodeHTML = (html) => {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
};

// Function to format the amount as a dollar amount
const formatAmount = (amount) => {
    const num = parseFloat(amount).toFixed(2);
    return num.startsWith('-') ? `-$${num.slice(1)}` : `$${num}`;
};

const SpendingSummary = () => {
    const [expenses, setExpenses] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

    // Fetch expenses when the component mounts
    useEffect(() => {
        axios.get('http://localhost:5000/expenses')  // Fetch from your backend
            .then((response) => {
                setExpenses(response.data);  // Store in the state
            })
            .catch((error) => {
                console.error('Error fetching expenses:', error);  // Error handling
            });
    }, []);  // This ensures it runs once when the component is mounted

    const handleSubcategoryChange = async (id, event, subcategory) => {
        const updatedExpenses = expenses.map(expense => 
            expense.id === id ? { ...expense, subcategory: event.target.value } : expense
        );
        setExpenses(updatedExpenses); // Update the state with new subcategory value
        try {
            // Send the updated subcategory to the backend
            await axios.put(`http://localhost:5000/expenses/${id}`, { subcategory });
            console.log('Subcategory updated successfully to', subcategory);
        } catch (error) {
            console.error(`Error updating Subcategory to ${subcategory}:`, error);
        }
    };

    const handleNoteChange = (id, event) => {
        const updatedExpenses = expenses.map(expense =>
            expense.id === id ? { ...expense, notes: event.target.value } : expense
        );
        setExpenses(updatedExpenses);
    };
    
    const handleNoteBlur = async (id, notes) => {
        try {
            await axios.put(`http://localhost:5000/expenses/${id}`, { notes });
            console.log('Notes updated successfully');
        } catch (error) {
            console.error('Error updating notes:', error);
        }
    };

    const handleSort = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const sortedExpenses = [...expenses].sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'date') {
            aValue = new Date(aValue);
            bValue = new Date(bValue);
        } else if (sortConfig.key === 'amount') {
            aValue = parseFloat(aValue);
            bValue = parseFloat(bValue);
        } else {
            aValue = aValue?.toString().toLowerCase();
            bValue = bValue?.toString().toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    return (
        <div>
            <h2>Spending Summary</h2>

            <table>
                <thead>
                    <tr>
                        {['account', 'date', 'description', 'category', 'subcategory', 'amount', 'notes'].map((column) => (
                            <th key={column} onClick={() => column !== 'notes' ? handleSort(column) : null} style={{ cursor: column !== 'notes' ? 'pointer' : 'default' }}>
                                {column.charAt(0).toUpperCase() + column.slice(1)}
                                {sortConfig.key === column ? (sortConfig.direction === 'asc' ? ' ▲' : ' ▼') : ''}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedExpenses.length > 0 ? (
                        sortedExpenses.map((expense, index) => (
                            <tr key={index}>
                                <td>{expense.account}</td>
                                <td>{formatDate(expense.date)}</td>
                                <td>{decodeHTML(expense.description)}</td>
                                <td>{decodeHTML(expense.category)}</td>
                                <td>
                                    <select value={expense.subcategory} className="subcategory-dropdown" onChange={(e) => handleSubcategoryChange(expense.id, e, e.target.value)}>
                                        <option value="Unselected">Select a subcategory...</option>
                                        <option value="Needs">Needs</option>
                                        <option value="Wants">Wants</option>
                                        <option value="Savings">Savings</option>
                                        <option value="Income">Income</option>
                                        <option value="Transfer">Transfer</option>
                                    </select>
                                </td>
                                <td>{formatAmount(expense.amount)}</td>
                                <td>
                                    <input
                                        type="text"
                                        value={expense.notes || ''}
                                        onChange={(e) => handleNoteChange(expense.id, e)}
                                        onBlur={() => handleNoteBlur(expense.id, expense.notes)} // On blur, save note to backend
                                    />
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="7">No expenses to display</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default SpendingSummary;
