import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './SpendingSummary.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']; // Added a fourth color

const SpendingSummary = () => {
    const [data, setData] = useState([]);

    useEffect(() => {
        // Fetch expenses data from your backend
        fetch('http://localhost:5000/expenses')
            .then(response => response.json())
            .then(expenses => {
                // Check if expenses data is received correctly
                console.log('Fetched expenses data:', expenses);

                // Group expenses by type and calculate totals, excluding "Income" and "Transfer" types
                const totals = expenses.reduce((acc, expense) => {
                    const { type, amount } = expense;

                    // Exclude "Income" and "Transfer" types
                    if (type === "Income" || type === "Transfer") {
                        return acc;
                    }

                    // Sanitize amount to ensure it's a number
                    const parsedAmount = parseFloat(amount);

                    // Check for valid number
                    if (!isNaN(parsedAmount) && parsedAmount !== Infinity && parsedAmount !== -Infinity) {
                        acc[type] = (acc[type] || 0) + parsedAmount; // No absolute value applied yet
                    } else {
                        console.warn(`Invalid amount for ${type}: ${amount}`);
                    }

                    return acc;
                }, {});

                console.log('Total expenses by type (excluding Income and Transfer):', totals);

                // Format data for the pie chart, round to 2 decimal places and apply absolute value at the end
                const formattedData = Object.keys(totals).map((key, index) => ({
                    name: key,
                    value: Math.abs(parseFloat(totals[key].toFixed(2))),  // Apply absolute value here
                    color: COLORS[index % COLORS.length], // Assign colors dynamically
                }));

                console.log('Formatted chart data:', formattedData);

                setData(formattedData);
            })
            .catch(error => console.error('Error fetching expenses:', error));
    }, []);

    return (
        <div className="spending-summary">
            <h2>Spending Summary</h2>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        label
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SpendingSummary;
