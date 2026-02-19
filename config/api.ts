/**
 * API Configuration
 * Centralized API URL configuration for the entire app
 * 
 * TESTING MODE: Uses .env.local to switch between backends without rebuilding
 * - Update .env.local with the backend URL you want to test
 * - Restart Expo (close app, stop metro, restart) to pick up changes
 */

// Read from environment variable (set in .env.local for testing)
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.92.95:8000/api';

// QUICK SWITCH OPTIONS (comment/uncomment to test different backends):
// VERCEL: https://inventory-application-git-backend-otikanelsons-projects.vercel.app/api
// RENDER: https://inventory-application-xjc5.onrender.com/api
// LOCAL: http://192.168.92.95:8000/api

// WebSocket URL (derived from API_URL)
export const WS_URL = API_URL.replace('/api', '').replace('http', 'ws');

// Log configuration on startup
console.log('═══════════════════════════════════════════════════════');
console.log('🌐 API CONFIGURATION LOADED');
console.log('═══════════════════════════════════════════════════════');
console.log('📍 API_URL:', API_URL);
console.log('🔌 WS_URL:', WS_URL);
console.log('🏷️  Mode:', API_URL.includes('render') ? 'RENDER (Production)' : API_URL.includes('vercel') ? 'VERCEL (Production)' : 'LOCAL (Development)');
console.log('⏰ Loaded at:', new Date().toISOString());
console.log('═══════════════════════════════════════════════════════');
