# 🚀 API Load Testing & Monitoring SPA - Setup Guide

## Quick Start

### Prerequisites
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Option 1: Automatic Setup (Recommended)

```bash
# Make the startup script executable (if not already)
chmod +x start-app.sh

# Run the application
./start-app.sh
```

The script will:
1. ✅ Check Node.js installation and version
2. 📦 Install all dependencies automatically
3. 🔧 Start the backend server on `http://localhost:3001`
4. 🎨 Start the frontend server on `http://localhost:5173`
5. 🌐 Open your browser to `http://localhost:5173`

### Option 2: Manual Setup

#### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

#### 2. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

#### 3. Start Backend Server
```bash
cd backend
npm start
```
Backend will run on `http://localhost:3001`

#### 4. Start Frontend Server (in a new terminal)
```bash
cd frontend
npm run dev
```
Frontend will run on `http://localhost:5173`

## 🌐 Accessing the Application

Once both servers are running:

1. **Open your browser** and navigate to: `http://localhost:5173`
2. **Explore the features**:
   - **API Test Panel**: Test individual API endpoints
   - **Load Test Panel**: Configure and run load tests with up to 10,000 virtual users
   - **Results Panel**: View test history, export reports, and analyze performance

## 🎯 Key Features to Try

### 1. API Testing
- Enter any public API endpoint (e.g., `https://jsonplaceholder.typicode.com/posts`)
- Configure headers and authentication
- Run single API tests

### 2. Load Testing
- Configure virtual users (1-10,000)
- Set ramp-up time and test duration
- Watch real-time metrics and charts
- View live logs during test execution

### 3. Results & Reports
- Browse test history
- Export results in CSV, JSON, or PDF format
- Analyze performance trends

## 🔧 Development Commands

### Backend
```bash
cd backend
npm run dev     # Start with hot reload
npm start       # Start production server
npm test        # Run tests
```

### Frontend
```bash
cd frontend
npm run dev     # Start development server
npm run build   # Build for production
npm run preview # Preview production build
npm test        # Run tests
```

## 📊 Default Ports

- **Frontend**: `http://localhost:5173`
- **Backend**: `http://localhost:3001`
- **WebSocket**: `ws://localhost:3001` (for real-time updates)

## 🛠 Troubleshooting

### Common Issues

#### Port Already in Use
If you get a "port already in use" error:
```bash
# Kill processes on port 3001 (backend)
npx kill-port 3001

# Kill processes on port 5173 (frontend)
npx kill-port 5173
```

#### Node.js Version Issues
Make sure you have Node.js 18 or higher:
```bash
node --version  # Should show v18.x.x or higher
```

#### Dependencies Issues
Clear node_modules and reinstall:
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

#### CORS Issues
If you encounter CORS errors, make sure both servers are running and the backend is accessible at `http://localhost:3001`.

## 🎨 UI Features

### Theme Support
- **Light Mode**: Default professional theme
- **Dark Mode**: Toggle in the header
- **System**: Automatically follows your OS preference

### Responsive Design
- **Desktop**: Full feature set with side-by-side panels
- **Tablet**: Responsive grid layout
- **Mobile**: Optimized touch interface with collapsible sections

### Real-time Features
- **Live Metrics**: Real-time charts and counters during load tests
- **Live Logs**: Streaming logs with filtering and search
- **WebSocket Updates**: Sub-second latency for all real-time data

## 📈 Performance Testing

### Sample API Endpoints for Testing
```
GET https://jsonplaceholder.typicode.com/posts
GET https://httpbin.org/delay/1
POST https://httpbin.org/post
GET https://api.github.com/users/octocat
```

### Load Test Recommendations
- **Start small**: Begin with 10-50 virtual users
- **Gradual increase**: Use ramp-up time to gradually increase load
- **Monitor metrics**: Watch response times and error rates
- **Respect rate limits**: Be mindful of target API rate limits

## 🔒 Security Notes

- **Local development only**: This setup is for local development
- **API keys**: Store sensitive credentials securely
- **Rate limiting**: Be respectful when testing external APIs
- **HTTPS**: Use HTTPS endpoints when possible

## 📚 Additional Resources

- **Project Documentation**: See `docs/PROJECT_COMPLETION_REPORT.md`
- **Task Details**: See `.kiro/specs/api-load-testing-spa/`
- **Component Documentation**: Explore the `frontend/src/components/` directory

## 🎉 Enjoy Testing!

Your API Load Testing & Monitoring SPA is now ready to use! Start by exploring the different panels and running your first load test.

For questions or issues, check the troubleshooting section above or review the comprehensive project documentation.

Happy testing! 🚀