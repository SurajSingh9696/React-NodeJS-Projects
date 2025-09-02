import React, { useState } from "react";
import axios from "axios";

export default function UploadForm() {
  const [files, setFiles] = useState([]);
  const [quality, setQuality] = useState(80);
  const [targetSizeKB, setTargetSizeKB] = useState("");
  const [layout, setLayout] = useState("portrait");
  const [margin, setMargin] = useState(20);
  const [autoOrientation, setAutoOrientation] = useState(true);
  const [operation, setOperation] = useState("compress");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    for (let f of files) formData.append("images", f);
    formData.append("quality", quality);
    if (targetSizeKB) formData.append("targetSizeKB", targetSizeKB);
    formData.append("layout", layout);
    formData.append("margin", margin);
    formData.append("autoOrientation", autoOrientation);

    let url = "http://localhost:5000/" + operation;
    const response = await axios.post(url, formData, { responseType: "blob" });
    const blob = new Blob([response.data]);
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = operation === "compress" ? "compressed.zip" : operation === "pdf" ? "output.pdf" : "compressed_output.pdf";
    link.click();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="file" multiple onChange={(e) => setFiles([...e.target.files])} className="block w-full border p-2 rounded" />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>Quality:</label>
          <input type="number" value={quality} onChange={(e) => setQuality(e.target.value)} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label>Target Size (KB):</label>
          <input type="number" value={targetSizeKB} onChange={(e) => setTargetSizeKB(e.target.value)} className="w-full border p-2 rounded" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>Layout:</label>
          <select value={layout} onChange={(e) => setLayout(e.target.value)} className="w-full border p-2 rounded">
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </div>
        <div>
          <label>Margin:</label>
          <input type="number" value={margin} onChange={(e) => setMargin(e.target.value)} className="w-full border p-2 rounded" />
        </div>
      </div>

      <div>
        <label>
          <input type="checkbox" checked={autoOrientation} onChange={(e) => setAutoOrientation(e.target.checked)} /> Auto Orientation
        </label>
      </div>

      <div>
        <label>Operation:</label>
        <select value={operation} onChange={(e) => setOperation(e.target.value)} className="w-full border p-2 rounded">
          <option value="compress">Compress</option>
          <option value="pdf">PDF</option>
          <option value="compress-pdf">Compress + PDF</option>
        </select>
      </div>

      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Submit</button>
    </form>
  );
}
