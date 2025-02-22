import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TransactionsTable.css';

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
    return `$${parseFloat(amount).toFixed(2)}`; // Ensure the amount is a number and show two decimal places
};

const TransactionsTable = () => {
    const [expenses, setExpenses] = useState([]);

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

    const handleNoteChange = (id, event) => {
        const updatedExpenses = expenses.map(expense => 
            expense.id === id ? { ...expense, notes: event.target.value } : expense
        );
        setExpenses(updatedExpenses); // Update the state with new note value
    };

    const handleNoteBlur = async (id, notes) => {
        try {
            // Send the updated note to the backend
            await axios.put(`http://localhost:5000/expenses/${id}`, { notes });
            console.log('Notes updated successfully');
        } catch (error) {
            console.error('Error updating notes:', error);
        }
    };

    return (
        <div>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Category</th>
                        <th>Subcategory</th>
                        <th>Amount</th>
                        <th>Notes</th>
                    </tr>
                </thead>
                <tbody>
                    {expenses.length > 0 ? (
                        expenses.map((expense, index) => (
                            <tr key={index}>
                                <td>{formatDate(expense.date)}</td>
                                <td>{decodeHTML(expense.description)}</td>
                                <td>{decodeHTML(expense.category)}</td>
                                <td>{decodeHTML(expense.subcategory)}</td>
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
                            <td colSpan="6">No expenses to display</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default TransactionsTable;
