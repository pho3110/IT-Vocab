import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { SpeechProvider } from './speech.jsx';
import './styles.css';
import './liquid-glass.css';
import './reference-glass.css';
import './ios-motion.css';
createRoot(document.getElementById('root')).render(<React.StrictMode><SpeechProvider><App /></SpeechProvider></React.StrictMode>);
