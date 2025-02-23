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
    const [filteredExpenses, setFilteredExpenses] = useState([]);
    const [filters, setFilters] = useState({
        category: [],
        subcategory: [],
        description: '',
        notes: ''
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

    // Handle description text search
    const handleNotesChange = (event) => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            notes: event.target.value
        }));
    };

    // Apply filters to the expenses
    useEffect(() => {
        const filtered = expenses.filter((expense) => {
            const matchesCategory = filters.category.length === 0 || filters.category.includes(expense.category);
            const matchesSubcategory = filters.subcategory.length === 0 || filters.subcategory.includes(expense.subcategory);
            const matchesDescription = filters.description === '' || decodeHTML(expense.description).toLowerCase().includes(filters.description.toLowerCase());
            const matchesNotes = filters.notes === '' || decodeHTML(expense.notes).toLowerCase().includes(filters.notes.toLowerCase());

            return matchesCategory && matchesSubcategory && matchesDescription && matchesNotes;
        });

        setFilteredExpenses(filtered);
    }, [filters, expenses]);

    const handleNoteChange = (id, event) => {
        const updatedExpenses = expenses.map(expense => 
            expense.id === id ? { ...expense, notes: event.target.value } : expense
        );
        setExpenses(updatedExpenses); // Update the state with new note value
    };

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
            console.error('Error updating Subcategory:', error);
        }
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

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
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
                <h4>Filters</h4>
                <span style={{transform: filtersVisible ? 'rotate(90deg)' : 'rotate(0deg)'}}>
                    {'▶'}
                </span>
            </div>

            {filtersVisible && (
                <div className="filters">
                    <div className='filter-module'>
                        <h4>Categories</h4>
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
                        <h4>Subcategories</h4>
                        <div className="checkbox-group">
                            {Array.from(new Set(expenses.map((expense) => expense.subcategory))).map((subcategory) => (
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
                        <h4>Descriptions</h4>
                        <input
                            type="text"
                            className="filter-input"
                            placeholder="Search descriptions"
                            value={filters.description}
                            onChange={handleDescriptionChange}
                        />
                    </div>
                    <div className='filter-module'>
                        <h4>Notes</h4>
                        <input
                            type="text"
                            className="filter-input"
                            placeholder="Search notes"
                            value={filters.notes}
                            onChange={handleNotesChange}
                        />
                    </div>
                </div>
            )}

            <table>
                <thead>
                    <tr>
                        {['date', 'description', 'category', 'subcategory', 'amount', 'notes'].map((column) => (
                            <th key={column} onClick={() => handleSort(column)}>
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
                                <td>{formatDate(expense.date)}</td>
                                <td>{decodeHTML(expense.description)}</td>
                                <td>{decodeHTML(expense.category)}</td>
                                <td>
                                    <select value={expense.subcategory} className="subcategory-dropdown" onChange={(e) => handleSubcategoryChange(expense.id, e, e.target.value)}>
                                        <option value="UNSET">Select a subcategory...</option>
                                        <option value="Needs">Needs</option>
                                        <option value="Wants">Wants</option>
                                        <option value="Savings">Savings</option>
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
                            <td colSpan="6">No expenses to display</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default TransactionsTable;
