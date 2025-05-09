export const DEFAULT_LIMIT = 5
// Crucial to modify in .env to production domain (including protocol)
// APP_URL doesn't support tunnel 'bird-game-gnat.ngrok-free.app'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"