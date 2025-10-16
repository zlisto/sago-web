# Sago - Scam Prevention Agent

A beautiful React-based chat application featuring Sago, a specialized scam prevention agent. Built with OpenAI GPT-4o, MongoDB, and a modern black/pink theme.

## ✨ Features

- **AI-Powered Chat**: GPT-4o integration for intelligent responses
- **Image Support**: Drag & drop, paste, or upload images for analysis
- **Math Rendering**: Beautiful LaTeX math formulas with KaTeX
- **Responsive Design**: Modern UI with Tailwind CSS
- **Chat History**: Persistent storage with MongoDB
- **Vector Store Ready**: Prepared for RAG integration

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB database
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/zlisto/sago-web.git
   cd sago-web
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd server
   npm install
   cd ..
   ```

4. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
   AZURE_OPENAI_API_VERSION=2024-02-15-preview
   AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment_name
   AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
   MONGODB_URI=your_mongodb_connection_string
   ```

5. **Seed the database with Sago's system prompt**
   ```bash
   cd server
   node seed-agents.js
   cd ..
   ```

6. **Start the application**
   
   **Terminal 1 (Backend):**
   ```bash
   cd server
   npm start
   ```
   
   **Terminal 2 (Frontend):**
   ```bash
   npm start
   ```

7. **Open your browser**
   Navigate to `http://localhost:3001`

## 📦 Dependencies

### Frontend Dependencies
```json
{
  "axios": "^1.11.0",
  "katex": "^0.16.22",
  "react": "^19.1.1",
  "react-dom": "^19.1.1",
  "react-katex": "^3.1.0",
  "react-markdown": "^10.1.0",
  "remark-math": "^6.0.0",
  "rehype-katex": "^7.0.0",
  "uuid": "^11.1.0"
}
```

### Backend Dependencies
```json
{
  "cors": "^2.8.5",
  "dotenv": "^17.2.2",
  "express": "^5.1.0",
  "mongoose": "^8.18.0",
  "multer": "^2.0.2",
  "openai": "^5.19.1",
  "uuid": "^11.1.0"
}
```

### Development Dependencies
```json
{
  "autoprefixer": "^10.4.0",
  "postcss": "^8.4.0",
  "tailwindcss": "^3.4.0"
}
```

> **⚠️ Important**: Use Tailwind CSS v3.4.0 specifically. Newer versions (v4+) have breaking changes with Create React App and PostCSS configuration that will cause build errors.

## 🔧 Updating Sago's System Prompt

To modify Sago's personality, expertise, or behavior:

1. **Edit the system prompt**
   ```bash
   # Open the seed file
   code server/seed-agents.js
   ```

2. **Modify the `sagoSystemPrompt` variable**
   ```javascript
   const sagoSystemPrompt = `Your new system prompt here...`;
   ```

3. **Update the database**
   ```bash
   cd server
   node seed-agents.js
   cd ..
   ```

4. **Restart the server**
   ```bash
   cd server
   npm start
   ```

### Example System Prompt Structure
```javascript
const sagoSystemPrompt = `You are Sago, a specialized scam prevention agent.

Your expertise includes:
- Identifying common scam patterns and red flags
- Educating users about financial safety
- Recognizing phishing attempts and social engineering
- Protecting against investment fraud and romance scams

Your approach:
- Be vigilant and proactive in spotting potential scams
- Provide clear, actionable advice for staying safe
- Use real-world examples to illustrate scam tactics
- Help users develop critical thinking skills

When explaining scam prevention concepts, format them clearly:

Example warning format:

🚨 **RED FLAG ALERT** 🚨

**What to watch for:**
- Unsolicited requests for money or personal information
- Pressure to act immediately
- Promises that seem too good to be true

**Protection steps:**
1. Verify the source independently
2. Never share personal or financial information
3. Take time to research before acting

Remember: You're here to protect users from scams and help them stay financially safe!`;
```

## 🎨 Customization

### Styling
- **Colors**: Edit `src/index.css` for theme colors
- **Fonts**: Modify font imports in `src/index.css`
- **Layout**: Update Tailwind classes in components

### Math Rendering
- **KaTeX Configuration**: Edit `src/components/ChatBubble.js`
- **Math Styling**: Modify `src/components/ChatBubble.css`

### Image Handling
- **Upload Limits**: Adjust `server/index.js` middleware limits
- **File Types**: Modify `server/routes/upload.js` validation

## 🚀 Deployment on Render

### Backend Deployment

1. **Create a new Web Service on Render**
2. **Connect your GitHub repository**
3. **Configure build settings:**
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Environment**: `Node`

4. **Add environment variables:**
   - `OPENAI_API_KEY`
   - `MONGODB_URI`
   - `OPENAI_VECTOR_STORE_ID` (optional)

### Frontend Deployment

1. **Create a new Static Site on Render**
2. **Connect your GitHub repository**
3. **Configure build settings:**
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
   - **Environment**: `Node`

4. **Add environment variables:**
   - `REACT_APP_API_URL` (your backend URL)

### Update Frontend API URL

Before deploying, update the proxy in `package.json`:
```json
{
  "proxy": "https://your-backend-app.onrender.com"
}
```

## 🛠️ Development

### Project Structure
```
sago-web/
├── public/                 # Static assets
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── App.js             # Main app component
│   └── index.css          # Global styles
├── server/                # Express backend
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── index.js           # Server entry point
│   └── seed-agents.js     # Database seeding
├── package.json           # Frontend dependencies
└── README.md              # This file
```

### Available Scripts

**Frontend:**
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

**Backend:**
- `cd server && npm start` - Start server
- `cd server && node seed-agents.js` - Seed database

## 🐛 Troubleshooting

### Common Issues

1. **Math not rendering**
   - Ensure `rehype-katex` is installed
   - Check that LaTeX is properly formatted with `$$...$$`

2. **Images not uploading**
   - Verify file size limits in `server/index.js`
   - Check CORS settings

3. **Database connection issues**
   - Verify MongoDB URI in `.env`
   - Ensure database is accessible

4. **OpenAI API errors**
   - Check API key validity
   - Verify rate limits

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review the console logs
- Ensure all dependencies are installed correctly