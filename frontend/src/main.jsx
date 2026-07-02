import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// Import défensif — si LanguageProvider crash, on fallback
let LanguageProvider
try {
  LanguageProvider = require('./context/LanguageContext').LanguageProvider
} catch(e) {
  console.error('LanguageContext missing:', e)
  LanguageProvider = ({ children }) => children
}

import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>
)