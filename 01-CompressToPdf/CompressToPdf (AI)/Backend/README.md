# CompressToPdf Backend

## Description
This is the backend service for the CompressToPdf application. It provides APIs to compress images, generate PDFs from images, and combine compression and PDF generation. The backend is built with Node.js and Express, and uses libraries like Sharp for image processing and pdf-lib for PDF generation.

## Features
- Compress multiple images with configurable quality and size
- Generate PDFs from uploaded images with layout and margin options
- Combine image compression and PDF generation in one operation
- Supports uploading multiple images at once
- Health check endpoint to verify server status

## Tech Stack
- Node.js
- Express.js
- Multer (for file uploads)
- Sharp (image processing)
- pdf-lib (PDF generation)
- CORS middleware

## API Endpoints
- POST `/compress`: Compress images
- POST `/pdf`: Generate PDF from images
- POST `/compress-pdf`: Compress images and generate PDF
- GET `/health`: Server health check

## Installation
1. Install dependencies:
   ```
   npm install
   ```
2. Start the server:
   ```
   npm start
   ```
3. The server listens on port 5000 by default.

## Notes
- Maximum upload size is 50MB with up to 20 files.
- Responses for file downloads are sent as binary attachments.
