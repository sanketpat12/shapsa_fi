import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000; // Default Render port

// Proxy all /api/nvidia requests to the real NVIDIA API
// This completely bypasses the browser CORS restrictions that were failing in production
app.use('/api/nvidia', createProxyMiddleware({
  target: 'https://integrate.api.nvidia.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api/nvidia': '' // Strips the /api/nvidia prefix before sending it to NVIDIA
  }
}));

// Serve the static React files from the Vite build directory
app.use(express.static(path.join(__dirname, 'dist')));

// Send all other requests to the React single-page app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Shapsa Production Server running on port ${PORT}`);
});
