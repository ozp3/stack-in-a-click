const express = require('express');
const cors = require('cors');
const { execFile } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Paths
const PROJECT_DIR = '/home/r580/Desktop/hermes-hackathon';
const STRIPE_BIN = path.join(PROJECT_DIR, 'bin/stripe');
const ENV_FILE = path.join(PROJECT_DIR, '.env');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Available services
const SERVICES = {
  'neon/postgres':   { name: 'Neon PostgreSQL', icon: '🐘', tier: 'free', desc: 'Serverless Postgres' },
  'upstash/redis':   { name: 'Upstash Redis',   icon: '⚡', tier: 'free', desc: 'Serverless Redis' },
  'twilio/sms':      { name: 'Twilio SMS',      icon: '💬', tier: 'payg', desc: 'Programmable SMS' },
  'vercel/hosting':  { name: 'Vercel Hosting',  icon: '▲', tier: 'free', desc: 'Frontend hosting' },
  'clerk/auth':      { name: 'Clerk Auth',      icon: '🔐', tier: 'free', desc: 'User authentication' },
  'runloop/sandbox': { name: 'Runloop Sandbox', icon: '🏖️', tier: 'payg', desc: 'Cloud dev sandbox' },
};

// GET available services
app.get('/api/services', (req, res) => {
  res.json({ services: SERVICES });
});

// POST provision selected services
app.post('/api/provision', async (req, res) => {
  const { providers } = req.body;

  if (!Array.isArray(providers) || providers.length === 0) {
    return res.status(400).json({ error: 'En az bir servis seçmelisin.' });
  }

  const results = [];
  const errors = [];

  for (const provider of providers) {
    if (!SERVICES[provider]) {
      errors.push({ provider, error: 'Bilinmeyen servis' });
      continue;
    }

    try {
      const output = await runStripe(['projects', 'add', provider]);
      results.push({
        provider,
        name: SERVICES[provider].name,
        icon: SERVICES[provider].icon,
        success: true,
        output: output.slice(-500), // last 500 chars
      });
    } catch (err) {
      errors.push({
        provider,
        name: SERVICES[provider].name,
        icon: SERVICES[provider].icon,
        success: false,
        error: err.message.slice(0, 300),
      });
    }
  }

  // Read current .env after provisioning
  let envContent = '';
  try {
    const fs = require('fs');
    envContent = fs.readFileSync(ENV_FILE, 'utf-8');
  } catch {}

  res.json({
    success: errors.length === 0,
    provisioned: results,
    errors,
    env: envContent,
    message: `${results.length} servis başarıyla kuruldu${errors.length ? `, ${errors.length} hata` : ''}!`,
  });
});

// GET current .env
app.get('/api/env', (req, res) => {
  try {
    const fs = require('fs');
    const env = fs.readFileSync(ENV_FILE, 'utf-8');
    res.json({ env });
  } catch {
    res.json({ env: '# Henüz servis kurulmadı.\n' });
  }
});

// GET stripe catalog
app.get('/api/catalog', async (req, res) => {
  try {
    const output = await runStripe(['projects', 'catalog']);
    res.json({ catalog: output });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET stripe projects list
app.get('/api/list', async (req, res) => {
  try {
    const output = await runStripe(['projects', 'list']);
    res.json({ list: output });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function runStripe(args) {
  return new Promise((resolve, reject) => {
    execFile(STRIPE_BIN, args, {
      cwd: PROJECT_DIR,
      env: { ...process.env, HOME: process.env.HOME },
      timeout: 60000,
    }, (error, stdout, stderr) => {
      if (error && !stdout) {
        reject(new Error(stderr || error.message));
        return;
      }
      resolve((stdout + stderr).trim() || 'OK');
    });
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Stack-in-a-Click API: http://0.0.0.0:${PORT}`);
});
