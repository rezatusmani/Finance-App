import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './App.css';
import ExpenseTracker from './ExpenseTracker'; // Import ExpenseTracker component

function App() {
    return (
        <Router>
            <div className="app-container">
                <h1 className="app-header">Finance App</h1>
                <nav className="app-nav">
                    <ul>
                        <li>
                            <Link to="/expense-tracker" className="nav-link">Expense Tracker</Link>
                        </li>
                        {/* Add more links here for other features */}
                    </ul>
                </nav>

                <Routes className="app-routes"> 
                    <Route path="/expense-tracker" element={<ExpenseTracker />} />
                    {/* Add more routes here for other features */}
                    <Route path="/" element={<h2 className="welcome-message">Welcome to My App! Select a feature from the menu.</h2>} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
