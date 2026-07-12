import app from './app.js';
import environment from './config/environment.js';

const PORT = environment.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 AssetFlow API Server successfully booted in ${environment.NODE_ENV} mode.`);
  console.log(`📡 Listening on http://localhost:${PORT}`);
});
