import axios from "axios";
import { useForm } from "react-hook-form";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { generatePDF, generatePdf } from "./utils/generatePdf";
import { downloadImagesAsZip } from "./utils/zipper";
import { downloadImage } from "./utils/singleImageDownload";
import "./App.css";

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
  const action = watch("action", "compressImage");

  const onSubmit = async (data) => {
    try {
      console.log(data);
      const format = data.format || "jpeg";
      const filename = data.outputFileName || "image";
      const files = data.file;
      const action = data.action;
      const formdata = new FormData();
      
      for (let i = 0; i < files.length; i++) {
        formdata.append("images", files[i]);
      }
      formdata.append("quality", data.quality);
      formdata.append("format", data.format);
      formdata.append("targetKB", data.targetSize);

      if (action === "compressImage") {
        const rawdata = await compressByServer(formdata);
        console.log(rawdata.data.data);
        const data = rawdata.data.data;
        if (data.length == 1) {
          downloadImage(data[0], format, filename);
          toast.success("Image compressed successfully!");
        } else {
          await downloadImagesAsZip(data, filename || "compressed_images");
          toast.success("Images compressed and downloaded as ZIP!");
        }
      }

      if (action === "compressToPdf") {
        const rawdata = await compressByServer(formdata);
        const data = rawdata.data.data;
        generatePDF(data, { 
          orientation: data.orientation, 
          format: data.pageSize, 
          margin: data.margins, 
          filename: data.outputFileName 
        });
        toast.success("PDF generated successfully!");
      }

      if (action === "generatePdf") {
        const files = data.file;
        generatePdf(files, { 
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
          <div className="form-container">
            <div className="form-settings">
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
                  Desired File Name:   
                  <input 
                    type="text" 
                    className="form-input"
                    {...register("outputFileName")} 
                    placeholder="Give your own name" 
                  />
                </label>
              </div>
            </div>
            
            <div className="form-actions">
              <div className="file-upload-section">
                <label className="file-upload-label">
                  <input 
                    type="file" 
                    className="file-input"
                    {...register("file", { required: "Please select at least one file" })} 
                    multiple 
                  />
                  <span className="file-upload-button">Choose Files</span>
                  {errors.file && <span className="error-message">{errors.file.message}</span>}
                </label>
              </div>
              
              <button type="submit" className="submit-button">Generate</button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

export default App;