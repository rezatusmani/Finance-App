import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './App.css';
import ExpenseTracker from './ExpenseTracker'; // Import ExpenseTracker component
import PlaidLink from './PlaidLink'; // Import new PlaidLink component (we'll create this)

function App() {
    console.log(process.env.PLAID_CLIENT_ID);
    console.log(process.env.PLAID_SECRET);
    console.log(process.env.PLAID_ENV);

    return (
        <Router>
            <div className="app-container">
                <h1 className="app-header">Finance App</h1>
                <nav className="app-nav">
                    <ul>
                        <li>
                            <Link to="/expense-tracker" className="nav-link">Expense Tracker</Link>
                        </li>
                        <li>
                            <Link to="/plaid-link" className="nav-link">Connect Bank Account</Link>
                        </li>
                    </ul>
                </nav>

                <Routes className="app-routes">
                    <Route path="/expense-tracker" element={<ExpenseTracker />} />
                    <Route path="/plaid-link" element={<PlaidLink />} /> {/* Add Plaid Link route */}
                    <Route path="/" element={<h2 className="welcome-message">Welcome to My App! Select a feature from the menu.</h2>} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
