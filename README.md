# Excel5 Converter

A professional React application to convert Excel files to UTF-8 CSV/Text files. Select any columns from your Excel file and export them with proper UTF-8 encoding.

## Features

- **Drag & Drop Upload**: Easy file selection for .xlsx and .xls files.
- **Column Selection**: Select any number of columns to export (all columns are pre-selected by default).
- **Export Options**: Download as CSV or Text file with UTF-8 encoding (BOM included for Excel compatibility).
- **Secure**: All processing happens client-side in your browser - no data is sent to any server.

## Setup & Deployment

This project is built with Vite and React.

### Prerequisites

- Node.js installed.

### Local Development

1. Clone the repo.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

### Deployment (Netlify)

1. Push this code to GitHub.
2. Import the repository into Netlify.
3. Deploy! No environment variables needed.
