/**
 * API Configuration
 * Centralized API URL configuration for the entire app
 */

// TEMPORARILY HARDCODED TO VERCEL FOR TESTING
// To switch back to environment variables, uncomment the line below and comment out the hardcoded line
export const API_URL = 'https://inventory-application-git-backend-otikanelsons-projects.vercel.app/api';
// export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

// WebSocket URL (derived from API_URL)
export const WS_URL = API_URL.replace('/api', '').replace('http', 'ws');

// Log configuration on startup
console.log('═══════════════════════════════════════════════════════');
console.log('🌐 API CONFIGURATION LOADED');
console.log('═══════════════════════════════════════════════════════');
console.log('📍 API_URL:', API_URL);
console.log('🔌 WS_URL:', WS_URL);
console.log('🏷️  Mode:', API_URL.includes('vercel') ? 'VERCEL (Production)' : 'LOCAL (Development)');
console.log('⏰ Loaded at:', new Date().toISOString());
console.log('═══════════════════════════════════════════════════════');
