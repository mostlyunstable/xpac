import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { WizardProvider } from './contexts/WizardContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { AIProvider } from './contexts/AIContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <NotificationProvider>
          <WizardProvider>
            <AIProvider>
              <App />
            </AIProvider>
          </WizardProvider>
        </NotificationProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)