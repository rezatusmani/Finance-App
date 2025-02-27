import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
    return (
        <nav className="app-nav">
            <ul>
                <li>
                    <div className='nav-link-container'>
                        <NavLink to="/transactions" className="nav-link" activeclassname="active">
                            All Transactions
                        </NavLink>
                    </div>
                    <div className='nav-link-container'>
                        <NavLink to="/statement-uploader" className="nav-link" activeclassname="active">
                            Statement Uploader
                        </NavLink>
                    </div>
                </li>
            </ul>
        </nav>
    );
};

export default Navigation;
