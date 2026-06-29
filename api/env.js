// API: GET /api/env
export default function handler(req, res) {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(process.cwd(), '.env');
  try {
    const env = fs.readFileSync(envPath, 'utf-8');
    res.status(200).json({ env });
  } catch {
    res.status(200).json({ env: '# Henüz servis kurulmadı.\n# Provision butonuna tıkla!' });
  }
}
