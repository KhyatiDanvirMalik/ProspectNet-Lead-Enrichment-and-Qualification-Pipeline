import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, FileText, X, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PipelineSpinner from '../components/PipelineSpinner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Upload = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  }, []);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setUploadStatus({ type: '', text: '' });
    // Accept CSV files
    if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
    } else {
      setUploadStatus({ type: 'error', text: 'Please upload a valid CSV file.' });
    }
  };

  const removeFile = () => {
    setFile(null);
    setUploadStatus({ type: '', text: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadStatus({ type: '', text: '' });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/leads/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to upload and process file');
      }

      const result = await response.json();
      setUploadStatus({ 
        type: 'success', 
        text: `Successfully uploaded and queued ${result.count || 'the'} leads for enrichment!` 
      });
      setFile(null); // Clear on success
      
    } catch (err) {
      console.error('Upload error:', err);
      setUploadStatus({ type: 'error', text: err.message || 'An error occurred during upload. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
          Bulk Upload Prospects
        </h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px' }}>
          Upload a CSV file containing lead names, companies, or domains to enrich them in bulk.
        </p>
      </div>

      {/* Status Banner */}
      {uploadStatus.text && (
        <div style={{ 
          padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: uploadStatus.type === 'error' ? '#fef2f2' : '#d1fae5',
          border: `1px solid ${uploadStatus.type === 'error' ? '#fca5a5' : '#6ee7b7'}`,
          color: uploadStatus.type === 'error' ? '#b91c1c' : 'var(--primary-dark)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {uploadStatus.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
            <span style={{ fontWeight: 500, fontSize: '14px' }}>{uploadStatus.text}</span>
          </div>
          
          {uploadStatus.type === 'success' && (
            <button 
              onClick={() => navigate('/')}
              style={{ background: 'none', border: 'none', color: 'var(--primary-dark)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '13px' }}
            >
              Go to Pipeline <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}

      {/* Upload Card */}
      <div className="card">
        
        {uploading ? (
          <div style={{ padding: '64px 0' }}>
            <PipelineSpinner message="Uploading and queuing your leads..." size="large" />
          </div>
        ) : (
          <>
            {/* Drag and Drop Zone */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !file && fileInputRef.current.click()}
              style={{
                border: isDragging ? '2px dashed var(--primary)' : '2px dashed var(--border)',
                backgroundColor: isDragging ? '#ecfdf5' : 'var(--surface-hover)',
                borderRadius: '12px',
                padding: '48px 24px',
                textAlign: 'center',
                cursor: file ? 'default' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px'
              }}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                accept=".csv" 
                style={{ display: 'none' }} 
              />
              
              {!file ? (
                <>
                  <div style={{ 
                    backgroundColor: 'var(--surface)', 
                    padding: '16px', 
                    borderRadius: '50%', 
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    color: isDragging ? 'var(--primary)' : 'var(--text-muted)'
                  }}>
                    <UploadCloud size={32} />
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: 'var(--text-main)' }}>
                      Click to upload or drag and drop
                    </h3>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                      CSV files only (Max 5MB)
                    </p>
                  </div>
                  <div style={{ marginTop: '16px', padding: '12px 24px', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '8px', fontWeight: 600, fontSize: '14px', display: 'inline-block' }}>
                    Select File
                  </div>
                </>
              ) : (
                /* Selected File View */
                <div style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 4px -1px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                    <div style={{ color: 'var(--primary)', flexShrink: 0 }}>
                      <FileText size={24} />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <p style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {file.name}
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeFile(); }}
                    style={{ background: '#fef2f2', border: 'none', color: '#b91c1c', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Remove file"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Upload Action */}
            {file && (
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  className="btn-primary" 
                  onClick={handleUpload}
                  style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                >
                  <UploadCloud size={18} />
                  Start Enrichment Process
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Instructions / Template hint */}
      <div style={{ marginTop: '32px', padding: '20px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', color: '#b45309' }}>
        <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} /> Format Requirements
        </h4>
        <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6' }}>
          Your CSV file must include headers in the first row. The system looks for columns named <strong>"name"</strong>, <strong>"company"</strong>, and <strong>"domain"</strong>. At least one of these columns must be present for a row to be processed.
        </p>
      </div>

    </div>
  );
};

export default Upload;