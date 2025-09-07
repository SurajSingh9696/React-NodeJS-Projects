# CompressToPdf

## Description
CompressToPdf is a full-stack application that allows users to compress images and generate PDFs from them. The frontend is built with React and Vite, providing a user-friendly interface for uploading images and configuring compression and PDF generation options. The backend is built with Node.js and Express, handling image processing and PDF creation using libraries like Sharp and pdf-lib.

## Features
- Upload multiple images for compression or PDF generation
- Configure image quality, target size, layout, margin, and auto orientation
- Generate PDFs from compressed images
- Download compressed images as ZIP or PDFs directly
- Health check endpoint for backend server status

## Tech Stack
- Frontend: React, Vite, Axios
- Backend: Node.js, Express, Multer, Sharp, pdf-lib, CORS

## Installation and Setup

### Frontend
1. Navigate to the frontend directory:
   ```
   cd React-NodeJS/01-CompressToPdf/CompressToPdf (Me)/Frontend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run start
   ```
4. Open your browser and go to `http://localhost:5173`.

### Backend
1. Navigate to the backend directory:
   ```
   cd React-NodeJS/01-CompressToPdf/CompressToPdf (Me)/Backend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Start the backend server:
   ```
   npm start
   ```
4. The backend server runs on `http://localhost:3333`.

## Usage
- Use the frontend interface to upload images and select operation (compress, pdf, compress-pdf).
- Configure options like quality, target size, layout, margin, and auto orientation.
- Submit the form to download the processed files.

## License
This project is open source and available under the MIT License.
