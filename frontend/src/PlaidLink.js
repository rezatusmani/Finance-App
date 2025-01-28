import React from 'react';
import { PlaidLink } from 'react-plaid-link';
import './PlaidLink.css'; // Import the CSS file

function PlaidLinkComponent() {
    const onSuccess = (token, metadata) => {
        console.log('Plaid Link success', token, metadata);
        // You can exchange the token here with your backend
    };

    return (
        <div className="plaid-link-container">
            <h2 className="plaid-link-title">Connect your Bank Account</h2>  {/* Title */}
            <PlaidLink
                clientName="Your App Name"
                env="sandbox"
                product={['auth', 'transactions']}
                publicKey={process.env.REACT_APP_PLAID_PUBLIC_KEY}
                onSuccess={onSuccess}
                className="plaid-link-button"
            >
                Connect Bank Account
            </PlaidLink>
        </div>
    );
}

export default PlaidLinkComponent;
