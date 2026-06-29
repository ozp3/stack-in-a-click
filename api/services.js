// API: GET /api/services — Full Stripe Projects catalog
const fs = require('fs');
const path = require('path');
const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, 'catalog.json'), 'utf-8'));

export default function handler(req, res) {
  res.status(200).json(catalog);
}
