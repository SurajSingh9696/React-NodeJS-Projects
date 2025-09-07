import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { toast, Toaster } from 'react-hot-toast';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('text');
  const [text, setText] = useState('');
  const [imageName, setImageName] = useState('');
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [qrValue, setQrValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const fileInputRef = useRef(null);
  const qrCodeRef = useRef(null);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setQrValue('');
    setFileName('');
    setImageName('');
    setUploadedImageUrl('');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file) => {
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file only');
      return;
    }

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should not exceed 5MB');
      return;
    }

    setFileName(file.name);
    toast.success('File selected successfully');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length) {
      validateAndSetFile(files[0]);
    }
  };

  const handleImageUpload = async () => {
    if (!fileName) {
      toast.error('Please select an image file first');
      return;
    }

    if (!imageName) {
      toast.error('Please provide a name for your image');
      return;
    }

    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', fileInputRef.current.files[0]);
      formData.append('imageName', imageName);

      const response = await axios.post('https://quickqr-backend-rsml.onrender.com/imageUpload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data && response.data.url) {
        setUploadedImageUrl(response.data.url);
        setQrValue(response.data.url);
        toast.success(response.data.message || 'Image uploaded successfully!');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrValue) {
      toast.error('No QR code to download');
      return;
    }

    // Create a canvas to convert SVG to PNG
    const svgElement = document.getElementById('qrcode-svg');
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `qrcode-${activeTab === 'text' ? 'text' : 'image'}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);
        URL.revokeObjectURL(svgUrl);
        
        toast.success('QR code downloaded successfully!');
      });
    };
    
    img.src = svgUrl;
  };

  const shareQRCode = async () => {
    if (!qrValue) {
      toast.error('No QR code to share');
      return;
    }

    try {
      // Convert SVG to data URL
      const svgElement = document.getElementById('qrcode-svg');
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      // Convert SVG to PNG
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(async (blob) => {
          const file = new File([blob], 'qrcode.png', { type: 'image/png' });
          
          if (navigator.share && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                title: 'QuickQR Code',
                text: 'Check out this QR code I generated with QuickQR',
                files: [file],
              });
              toast.success('QR code shared successfully!');
            } catch (error) {
              console.error('Sharing failed', error);
              toast.error('Sharing failed. Please try another method.');
            }
          } else {
            // Fallback for browsers that don't support sharing files
            const pngUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = pngUrl;
            link.download = 'qrcode.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('QR code image downloaded for sharing!');
          }
          
          URL.revokeObjectURL(svgUrl);
        });
      };
      img.src = svgUrl;
    } catch (error) {
      console.error('Error sharing QR code:', error);
      toast.error('Failed to share QR code');
    }
  };

  // Update QR code value when text changes
  useEffect(() => {
    if (activeTab === 'text') {
      setQrValue(text);
    }
  }, [text, activeTab]);

  return (
    <div className="app">
      <Toaster position="top-center" />
      <div className="container">
        <header className="header">
          <h1><i className="fas fa-qrcode"></i> QuickQR</h1>
          <p>Convert text or images to QR codes instantly</p>
        </header>

        <div className="tab-container">
          <div 
            className={`tab ${activeTab === 'text' ? 'active' : ''}`}
            onClick={() => handleTabChange('text')}
          >
            <i className="fas fa-font"></i> Text to QR
          </div>
          <div 
            className={`tab ${activeTab === 'image' ? 'active' : ''}`}
            onClick={() => handleTabChange('image')}
          >
            <i className="fas fa-image"></i> Image to QR
          </div>
        </div>

        <div className="main-content">
          {/* Left Panel - Input */}
          <div className="input-panel">
            {activeTab === 'text' ? (
              <div className="text-input-section">
                <div className="input-group">
                  <label htmlFor="text-input">Enter your text or URL</label>
                  <input
                    type="text"
                    id="text-input"
                    className="text-input"
                    placeholder="Type or paste your text here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                </div>
                <div className="action-buttons">
                  <button 
                    className="btn btn-primary" 
                    onClick={downloadQRCode}
                    disabled={!qrValue}
                  >
                    <i className="fas fa-download"></i> Download QR
                  </button>
                  <button 
                    className="btn btn-outline"
                    onClick={shareQRCode}
                    disabled={!qrValue}
                  >
                    <i className="fas fa-share-alt"></i> Share
                  </button>
                </div>
              </div>
            ) : (
              <div className="image-input-section">
                <div className="input-group">
                  <label htmlFor="image-name">Image Name *</label>
                  <input
                    type="text"
                    id="image-name"
                    className="image-name-input"
                    placeholder="Enter a name for your image..."
                    value={imageName}
                    onChange={(e) => setImageName(e.target.value)}
                    required
                  />
                </div>

                <div 
                  className={`upload-area ${isDragging ? 'drag-over' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current.click()}
                >
                  <i className="fas fa-cloud-upload-alt"></i>
                  <h3>Upload your image</h3>
                  <p>Drag & drop your file here or click to browse</p>
                  <p className="file-requirements">Max size: 5MB | Image files only</p>
                  <button className="browse-btn">Browse Files</button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="file-input"
                    onChange={handleFileUpload}
                    accept="image/*"
                  />
                  {fileName && <p className="file-selected">Selected: {fileName}</p>}
                </div>

                <button 
                  className="btn btn-primary upload-btn"
                  onClick={handleImageUpload}
                  disabled={!fileName || !imageName || isLoading}
                >
                  {isLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Uploading...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-upload"></i> Upload Image
                    </>
                  )}
                </button>

                {uploadedImageUrl && (
                  <div className="upload-success">
                    <p>Image uploaded successfully!</p>
                    <p className="expiry-notice">This image will be available for 24 hours</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Panel - QR Code Display */}
          <div className="output-panel">
            <div className="qr-container">
              {qrValue ? (
                <>
                  <QRCodeSVG
                    id="qrcode-svg"
                    value={qrValue}
                    size={200}
                    level="H"
                    includeMargin
                    ref={qrCodeRef}
                  />
                  <div className="qr-actions">
                    <button 
                      className="btn btn-primary" 
                      onClick={downloadQRCode}
                    >
                      <i className="fas fa-download"></i> Download QR
                    </button>
                    <button 
                      className="btn btn-outline"
                      onClick={shareQRCode}
                    >
                      <i className="fas fa-share-alt"></i> Share
                    </button>
                  </div>
                </>
              ) : (
                <div className="qr-placeholder">
                  <i className="fas fa-qrcode"></i>
                  <p>
                    {activeTab === 'text' 
                      ? 'Enter text to generate QR code' 
                      : 'Upload an image to generate QR code'
                    }
                  </p>
                </div>
              )}
            </div>

            {activeTab === 'image' && uploadedImageUrl && (
              <div className="warning">
                <i className="fas fa-exclamation-triangle"></i>
                <span>The image will be available only for 24 hours</span>
              </div>
            )}
          </div>
        </div>

        <footer className="footer">
          <p>© 2023 QuickQR | All rights reserved</p>
        </footer>
      </div>
    </div>
  );
}

export default App;