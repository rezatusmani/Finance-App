import React, { useState } from 'react';
import axios from 'axios';
import './StatementUploader.css';

const StatementUploader = () => {
    const [file, setFile] = useState(null);
    const [showFileInfo, setShowFileInfo] = useState(false);
    const [showMappingPrompt, setShowMappingPrompt] = useState(false);
    const [map, setMap] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setShowFileInfo(true);

            // Automatically trigger mapping check when a file is selected
            checkFileMapping(e.target.files[0]);
        }
    };

    const checkFileMapping = (file) => {
        setIsLoading(true);

        // Read the first line of the file (headers)
        const reader = new FileReader();
        reader.onload = () => {
            const fileContent = reader.result;
            const firstLine = fileContent.split('\n')[0]; // Get the first line (headers)

            const headers = firstLine.split(','); // Assuming CSV file, adjust if necessary

            // Send file headers to backend for mapping check
            axios.post('http://localhost:5000/upload-and-check', { headers }, {
                headers: { 'Content-Type': 'application/json' }
            })
            .then((response) => {
                if (response.data.mappingFound) {
                    console.log('File contains a matching map:', response.data.map);
                    setMap(response.data.map);
                    setShowMappingPrompt(false); // Hide mapping prompt if found
                } else {
                    console.log('No matching map found.');
                    setMap(null);
                    setShowMappingPrompt(true); // Show mapping prompt if not found
                }
                setIsLoading(false);
            })
            .catch((error) => {
                console.error('Error uploading file:', error);
                setIsLoading(false);
            });
        };
        
        reader.readAsText(file); // Read file as text (for CSV, assuming the headers are the first row)
    };

    const handleFileUpload = () => {
        // Send the file and the mapping to the backend
        const formData = new FormData();
        formData.append('file', file);
        formData.append('mapping', JSON.stringify(map)); // Convert map to a JSON string

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

    const handleCreateMapping = (newMapping) => {
        // Send the new mapping to the backend to update `mapping.json`
        axios.post('http://localhost:5000/create-mapping', { newMapping })
            .then((response) => {
                console.log('Mapping created:', response.data);
                setMap(null);
                setShowMappingPrompt(false);
                // Optionally, you can re-trigger the file upload here to use the new mapping
            })
            .catch((error) => {
                console.error('Error creating mapping:', error);
            });
    };

    const handleCancelMapping = () => {
        setShowMappingPrompt(false);
        setFile(null);
        setShowFileInfo(false);
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

                            {map ? (
                                <button onClick={() => handleFileUpload()} className={`upload-button ${showFileInfo ? 'show' : 'hide'}`}>
                                    Upload
                                </button>
                            ) : (
                                <button className={`upload-button ${showFileInfo ? 'show' : 'hide'}`} disabled={isLoading}>
                                    {isLoading ? 'Checking Mapping...' : 'Check Mapping'}
                                </button>
                            )}

                            <button onClick={handleDetach} className={`detach-button ${showFileInfo ? 'show' : 'hide'}`}>Detach</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Mapping Prompt when no matching map is found */}
            {showMappingPrompt && (
                <div className="mapping-prompt">
                    <h3>No matching mapping found!</h3>
                    <p>Please create a mapping or detach the file.</p>
                    <button onClick={() => handleCreateMapping(map)}>Create New Mapping</button>
                    <button onClick={handleCancelMapping}>Detach</button>
                </div>
            )}
        </div>
    );
};

export default StatementUploader;
