# Excel5 Converter & AI Analyst

A professional React application to convert Excel files to UTF-8 CSV/Text files. It includes AI-powered column analysis using Google Gemini to automatically detect the most important data.

## Features

- **Drag & Drop Upload**: Easy file selection for .xlsx and .xls files.
- **AI Analysis**: Uses Google Gemini (Flash 2.5) to suggest the 5 most relevant columns.
- **Custom Selection**: Manually select or adjust column selection (limit 5).
- **Export Options**: Download as CSV or Text file with UTF-8 encoding (BOM included).
- **Secure**: All parsing happens client-side; data is only sent to AI for analysis if requested.

## Setup & Deployment

This project is built with Vite and React.

### Prerequisites

- Node.js installed.
- A Google Gemini API Key.

### Local Development

1. Clone the repo.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory:
   ```env
   API_KEY=your_google_gemini_api_key
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

### Deployment (Vercel/Netlify)

1. Push this code to GitHub.
2. Import the repository into Vercel or Netlify.
3. **Important**: Add your `API_KEY` as an Environment Variable in the deployment settings.
4. Deploy!
