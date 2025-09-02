import { useState, useCallback } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { generatePDF, generatePdf } from "./utils/generatePdf";
import { downloadImagesAsZip } from "./utils/zipper";
import { downloadImage } from "./utils/singleImageDownload";
import "./App1.css";

async function compressByServer(formData) {
  try {
    const res = await axios.post("http://localhost:3333/compress", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
    return res;
  } catch (error) {
    console.error("Upload Failed: ", error);
    throw new Error("Server compression failed");
  }
}

function App() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const action = watch("action", "compressImage");

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  }, [isDragging]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length === 0) return;
    
    const validFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/') || file.type === 'application/pdf'
    );
    
    if (validFiles.length === 0) {
      toast.error("Please upload only image or PDF files");
      return;
    }
    
    setUploadedFiles(validFiles);
    toast.success(`Added ${validFiles.length} file(s)`);
  }, []);

  const handleFileSelect = useCallback((e) => {
    const files = e.target.files;
    if (files.length === 0) return;
    
    const validFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/') || file.type === 'application/pdf'
    );
    
    if (validFiles.length === 0) {
      toast.error("Please upload only image or PDF files");
      return;
    }
    
    setUploadedFiles(validFiles);
    toast.success(`Added ${validFiles.length} file(s)`);
  }, []);

  const removeFile = useCallback((index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const onSubmit = async (data) => {
    try {
      if (uploadedFiles.length === 0) {
        toast.error("Please upload at least one file");
        return;
      }

      const format = data.format || "jpeg";
      const filename = data.outputFileName || "image";
      const action = data.action;
      const formdata = new FormData();
      
      for (let i = 0; i < uploadedFiles.length; i++) {
        formdata.append("images", uploadedFiles[i]);
      }
      formdata.append("quality", data.quality);
      formdata.append("format", data.format);
      formdata.append("targetKB", data.targetSize);

      if (action === "compressImage") {
        const rawdata = await compressByServer(formdata);
        const responseData = rawdata.data.data;
        if (responseData.length === 1) {
          downloadImage(responseData[0], format, filename);
          toast.success("Image compressed successfully!");
        } else {
          await downloadImagesAsZip(responseData, filename || "compressed_images");
          toast.success("Images compressed and downloaded as ZIP!");
        }
      }

      if (action === "compressToPdf") {
        const rawdata = await compressByServer(formdata);
        const responseData = rawdata.data.data;
        generatePDF(responseData, { 
          orientation: data.orientation, 
          format: data.pageSize, 
          margin: data.margins, 
          filename: data.outputFileName 
        });
        toast.success("PDF generated successfully!");
      }

      if (action === "generatePdf") {
        generatePdf(uploadedFiles, { 
          orientation: data.orientation, 
          format: data.pageSize, 
          margin: data.margins, 
          filename: data.outputFileName 
        });
        toast.success("PDF created successfully!");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "An error occurred during processing");
    }
  };

  return (
    <div className="app">
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      <header className="app-header">
        <h1 className="app-title">Compress2Pdf</h1>
        <h3 className="app-subtitle">Your one-stop solution for Document Compression</h3>
      </header>

      <main className="app-main">
        <form className="app-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="form-layout">
            <div className="form-settings-panel">
              <h2 className="settings-title">Settings</h2>

              <div className="form-section">
                <label className="form-label">
                  Action:
                  <select 
                    className="form-select"
                    id="action" 
                    {...register("action")} 
                    defaultValue="compressImage"
                  >
                    <option value="compressImage">Compress Image</option>
                    <option value="generatePdf">Generate PDF</option>
                    <option value="compressToPdf">Compress To PDF</option>
                  </select>
                </label>
              </div>
              
              {(action === "compressImage" || action === "compressToPdf") && (
                <div className="form-section">
                  <h3 className="section-title">Compression Settings</h3>
                  <label className="form-label">
                    Quality: 
                    <input 
                      type="number" 
                      min={10} 
                      max={100} 
                      defaultValue={80} 
                      className="form-input"
                      {...register("quality", { 
                        required: "Quality is required",
                        min: { value: 10, message: "Minimum quality is 10" },
                        max: { value: 100, message: "Maximum quality is 100" }
                      })} 
                    />
                    {errors.quality && <span className="error-message">{errors.quality.message}</span>}
                  </label>
                  
                  <label className="form-label">
                    Target Size (optional): 
                    <input 
                      type="text" 
                      placeholder="in KB" 
                      className="form-input"
                      {...register("targetSize")} 
                    />
                  </label>
                  
                  <label className="form-label">
                    Format:
                    <select 
                      className="form-select"
                      id="format" 
                      {...register("format")}
                      defaultValue="jpeg"
                    >
                      <option value="jpeg">JPEG</option>
                      <option value="png">PNG</option>
                      <option value="webp">WEBP</option>
                    </select>
                  </label>
                </div>
              )}
              
              {(action === "generatePdf" || action === "compressToPdf") && (
                <div className="form-section">
                  <h3 className="section-title">PDF Settings</h3>
                  <label className="form-label">
                    Page Size:
                    <select 
                      className="form-select"
                      defaultValue="a4" 
                      {...register("pageSize")}
                    >
                      <option value="a4">A4</option>
                      <option value="a5">A5</option>
                      <option value="letter">Letter</option>
                      <option value="legal">Legal</option>
                    </select>
                  </label>
                  
                  <label className="form-label">
                    Orientation:
                    <select 
                      className="form-select"
                      defaultValue="p" 
                      {...register("orientation")}
                    >
                      <option value="p">Portrait</option>
                      <option value="l">Landscape</option>
                    </select>
                  </label>
                  
                  <label className="form-label">
                    Margins: 
                    <input 
                      type="number" 
                      min={0} 
                      defaultValue={0} 
                      className="form-input"
                      {...register("margins")} 
                    />
                  </label>
                </div>
              )}
              
              <div className="form-section">
                <label className="form-label">
                  Output File Name:   
                  <input 
                    type="text" 
                    className="form-input"
                    {...register("outputFileName")} 
                    placeholder="Enter file name" 
                  />
                </label>
              </div>
              
              <button type="submit" className="submit-button">Process Files</button>
            </div>
            
            <div className="file-upload-panel">
              <h2 className="settings-title">Upload Files</h2>
              
              <div 
                className={`drop-zone ${isDragging ? 'dragging' : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className="drop-content">
                  <svg className="drop-icon" viewBox="0 0 24 24" width="48" height="48">
                    <path fill="currentColor" d="M14,13V17H10V13H7L12,8L17,13M19.35,10.03C18.67,6.59 15.64,4 12,4C9.11,4 6.6,5.64 5.35,8.03C2.34,8.36 0,10.9 0,14A6,6 0 0,0 6,20H19A5,5 0 0,0 24,15C24,12.36 21.95,10.22 19.35,10.03Z" />
                  </svg>
                  <p className="drop-text">Drag & Drop your files here</p>
                  <p className="drop-subtext">or</p>
                  <label className="browse-button">
                    Browse Files
                    <input 
                      type="file" 
                      className="file-input"
                      onChange={handleFileSelect}
                      multiple 
                    />
                  </label>
                </div>
              </div>
              
              {uploadedFiles.length > 0 && (
                <div className="uploaded-files">
                  <h3 className="files-title">Selected Files ({uploadedFiles.length})</h3>
                  <div className="files-list">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="file-item">
                        <div className="file-info">
                          <span className="file-icon">📄</span>
                          <span className="file-name">{file.name}</span>
                          <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button 
                          type="button" 
                          className="remove-file-btn"
                          onClick={() => removeFile(index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

export default App;