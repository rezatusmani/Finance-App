import React from 'react';
import { BrowserRouter as Router, Route, Routes, } from 'react-router-dom';
import './App.css';
import ExpenseUploader from './ExpenseUploader'; // Import ExpenseUploader component
import TransactionsTable from './TransactionsTable'; // Import TransactionsTable component
import Navigation from './Navigation'; // Import Navigation component

function App() {
    return (
        <Router>
            <div className="app-container">
                <div className='app-header-container'>
                    <h1>Finance App</h1>
                </div>
                <Navigation />

                <div className='app-content-container'>
                    <Routes className="app-routes">
                        <Route path="/transactions" element={<TransactionsTable />} />
                        <Route path="/expense-uploader" element={<ExpenseUploader />} />
                        <Route path="/expenses" element={<h2 className="error-message">Expenses page coming soon!</h2>} />
                        <Route path="*" element={<h2 className="error-message">Finance App</h2>} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;
