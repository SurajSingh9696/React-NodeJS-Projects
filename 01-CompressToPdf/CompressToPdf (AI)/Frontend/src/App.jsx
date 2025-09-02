import React from "react";
import UploadForm from "./components/UploadForm";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white shadow-xl rounded-2xl p-6 w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-4 text-center">Image Compressor & PDF Generator</h1>
        <UploadForm />
      </div>
    </div>
  );
}
