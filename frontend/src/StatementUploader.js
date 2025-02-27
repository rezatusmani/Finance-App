import React, { useState } from 'react';
import axios from 'axios';
import './StatementUploader.css';

const StatementUploader = () => {
    const [file, setFile] = useState(null);
    const [showFileInfo, setShowFileInfo] = useState(false);

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setShowFileInfo(true);
        }
    };

    const handleUpload = () => {
        if (!file) {
            alert("Please select a file before uploading.");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        axios.post('http://localhost:5000/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        .then((response) => {
            console.log('Upload successful:', response.data);
            setTimeout(() => {
                setFile(null);
                setShowFileInfo(false);
            }, 400); // Delay to allow transition
        })
        .catch((error) => {
            console.error('Error uploading file:', error);
        });
    };

    const handleDetach = () => {
        setShowFileInfo(false);
        setTimeout(() => {
            setFile(null);
        }, 300); // Delay to allow transition
    };

    return (
        <div className="expense-uploader">
            <h2>Upload Statements</h2>
            
            <input
                type="file"
                accept=".csv"
                id="file-input"
                onChange={handleFileChange}
            />

            <div className="file-actions">
                {!file ? (
                    <label htmlFor="file-input" className="custom-file-upload">
                        Choose File
                    </label>
                ) : (
                    <div className="file-info-container">
                        <div className='file-info'>
                            <label>{file.name}</label>
                            <button onClick={handleUpload} className={`upload-button ${showFileInfo ? 'show' : 'hide'}`}>Upload</button>
                            <button onClick={handleDetach} className={`detach-button ${showFileInfo ? 'show' : 'hide'}`}>Detach</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatementUploader;
