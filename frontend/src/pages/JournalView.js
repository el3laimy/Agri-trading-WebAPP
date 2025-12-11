import React, { useState } from 'react';
import JournalEntryForm from '../components/JournalEntryForm';

const JournalView = () => {
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleSave = async (payload) => {
        setError(null);
        setSuccess(null);
        try {
            const response = await fetch('http://localhost:8000/api/v1/journal/journal-entries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Failed to create journal entry');
            }
            setSuccess('Journal entry created successfully!');
            // In a real app, you'd probably redirect or clear the form
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h1>New Journal Entry</h1>
            </div>
            
            {success && <div className="alert alert-success">{success}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="card">
                <div className="card-body">
                    <JournalEntryForm 
                        onSave={handleSave} 
                        onCancel={() => { /* Clear form or redirect */ setSuccess(null); setError(null); }} 
                    />
                </div>
            </div>

            {/* TODO: Add a list of past journal entries here */}
        </div>
    );
};

export default JournalView;
