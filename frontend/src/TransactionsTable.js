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
    const num = parseFloat(amount).toFixed(2);
    return num.startsWith('-') ? `-$${num.slice(1)}` : `$${num}`;
};

const TransactionsTable = () => {
    const [expenses, setExpenses] = useState([]);
    const [filteredExpenses, setFilteredExpenses] = useState([]);
    const [filters, setFilters] = useState({
        account: [],
        category: [],
        subcategory: [],
        description: '',
        notes: '',
        startDate: '',
        endDate: '',
        minAmount: '',
        maxAmount: '',
    });
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [filtersVisible, setFiltersVisible] = useState(false);  // New state for toggling visibility

    // Fetch expenses when the component mounts
    useEffect(() => {
        axios.get('http://localhost:5000/expenses')  // Fetch from your backend
            .then((response) => {
                setExpenses(response.data);  // Store in the state
                setFilteredExpenses(response.data);  // Initialize filtered expenses
            })
            .catch((error) => {
                console.error('Error fetching expenses:', error);  // Error handling
            });
    }, []);  // This ensures it runs once when the component is mounted

    // Function to handle filter checkbox changes
    const handleFilterChange = (event, type) => {
        const { value, checked } = event.target;
        setFilters((prevFilters) => {
            const updatedFilters = { ...prevFilters };
            if (checked) {
                updatedFilters[type] = [...updatedFilters[type], value];
            } else {
                updatedFilters[type] = updatedFilters[type].filter((item) => item !== value);
            }
            return updatedFilters;
        });
    };

    // Handle description text search
    const handleDescriptionChange = (event) => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            description: event.target.value
        }));
    };

    // Handle notes text search
    const handleNotesChange = (event) => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            notes: event.target.value
        }));
    };

    // Handle date range filter change
    const handleDateChange = (event) => {
        const { name, value } = event.target;
        setFilters((prevFilters) => ({
            ...prevFilters,
            [name]: value
        }));
    };

    // Handle amount range filter change
    const handleAmountChange = (event) => {
        const { name, value } = event.target;
        setFilters((prevFilters) => ({
            ...prevFilters,
            [name]: value
        }));
    };

    // Handle the "Delete All" button click
    const handleDeleteAll = async () => {
        const confirmation = window.confirm('Are you sure you want to delete all expenses?');
        if (confirmation) {
            try {
                await axios.delete('http://localhost:5000/expenses');  // Send delete request to backend
                setExpenses([]);
                setFilteredExpenses([]);
                alert('All expenses have been deleted successfully.');
            } catch (error) {
                console.error('Error deleting all expenses:', error);
                alert('An error occurred while deleting the expenses.');
            }
        }
    };

    // Apply filters to the expenses
    useEffect(() => {
        const filtered = expenses.filter((expense) => {
            const matchesAccount = filters.account.length === 0 || filters.account.includes(expense.account);
            const matchesCategory = filters.category.length === 0 || filters.category.includes(expense.category);
            const matchesSubcategory = filters.subcategory.length === 0 || filters.subcategory.includes(expense.subcategory);
            const matchesDescription = filters.description === '' || decodeHTML(expense.description).toLowerCase().includes(filters.description.toLowerCase());
            const matchesNotes = filters.notes === '' || decodeHTML(expense.notes).toLowerCase().includes(filters.notes.toLowerCase());

            // Date range filter
            const matchesDate = (!filters.startDate || new Date(expense.date) >= new Date(filters.startDate)) &&
                                (!filters.endDate || new Date(expense.date) <= new Date(filters.endDate));

            // Amount range filter
            const matchesAmount = 
                (filters.minAmount === '' || parseFloat(expense.amount) >= parseFloat(filters.minAmount)) &&
                (filters.maxAmount === '' || parseFloat(expense.amount) <= parseFloat(filters.maxAmount));

            return matchesAccount && matchesCategory && matchesSubcategory && matchesDescription && matchesNotes && matchesDate && matchesAmount;
        });

        setFilteredExpenses(filtered);
    }, [filters, expenses]);

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
        const updatedExpenses = filteredExpenses.map(expense =>
            expense.id === id ? { ...expense, notes: event.target.value } : expense
        );
        setFilteredExpenses(updatedExpenses); // Update only filtered expenses
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

    const sortedExpenses = [...filteredExpenses].sort((a, b) => {
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

    // Toggle the filter visibility
    const toggleFilters = () => {
        setFiltersVisible(!filtersVisible);
    };

    return (
        <div>
            <div className="filters-header" onClick={toggleFilters} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <h4>Filter By</h4>
                <span style={{transform: filtersVisible ? 'rotate(90deg)' : 'rotate(0deg)'}}>
                    {'▶'}
                </span>
            </div>

            {filtersVisible && (
                <div className="filters">
                    <div className='filter-module'>
                        <h4>Account</h4>
                        <div className="checkbox-group">
                            {Array.from(new Set(expenses.map((expense) => expense.account))).map((account) => (
                                <label key={account}>
                                    <input
                                        type="checkbox"
                                        value={account}
                                        onChange={(e) => handleFilterChange(e, 'account')}
                                    />
                                    {account}
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className='filter-module'>
                        <h4>Date</h4>
                        <input
                            className='filter-input'
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleDateChange}
                        />
                        <input
                            className='filter-input'
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleDateChange}
                        />
                    </div>
                    <div className='filter-module'>
                        <h4>Description</h4>
                        <input
                            type="text"
                            className="filter-input"
                            placeholder="Search"
                            value={filters.description}
                            onChange={handleDescriptionChange}
                        />
                    </div>
                    <div className='filter-module'>
                        <h4>Category</h4>
                        <div className="checkbox-group">
                            {Array.from(new Set(expenses.map((expense) => expense.category))).map((category) => (
                                <label key={category}>
                                    <input
                                        type="checkbox"
                                        value={category}
                                        onChange={(e) => handleFilterChange(e, 'category')}
                                    />
                                    {category}
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className='filter-module'>
                        <h4>Subcategory</h4>
                        <div className="checkbox-group">
                            {Array.from(new Set(expenses.map((expense) => expense.subcategory))).filter(Boolean).map((subcategory) => (
                                <label key={subcategory}>
                                    <input
                                        type="checkbox"
                                        value={subcategory}
                                        onChange={(e) => handleFilterChange(e, 'subcategory')}
                                    />
                                    {subcategory}
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className='filter-module'>
                        <h4>Amount</h4>
                        <input
                            className='filter-input'
                            type="number"
                            name="minAmount"
                            placeholder="Min"
                            value={filters.minAmount}
                            onChange={handleAmountChange}
                        />
                        <input
                            className='filter-input'
                            type="number"
                            name="maxAmount"
                            placeholder="Max"
                            value={filters.maxAmount}
                            onChange={handleAmountChange}
                        />
                    </div>
                    <div className='filter-module'>
                        <h4>Notes</h4>
                        <input
                            type="text"
                            className="filter-input"
                            placeholder="Search"
                            value={filters.notes}
                            onChange={handleNotesChange}
                        />
                    </div>
                </div>
            )}

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

            <button onClick={handleDeleteAll} className="delete-btn">
                Delete All
            </button>
        </div>
    );
};

export default TransactionsTable;
