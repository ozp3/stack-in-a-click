// API: POST /api/provision
// Provisions Stripe Projects services. Falls back to demo mode when stripe CLI unavailable.

const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const DEMO_MODE = !fs.existsSync(path.join(process.cwd(), 'bin/stripe'));

const DEMO_KEYS = {
  'neon/postgres':   `DATABASE_URL=postgresql://neon-prod-7x9a:${randHex(24)}@ep-ancient-tree-${randHex(8)}.us-east-2.aws.neon.tech/neondb?sslmode=require`,
  'upstash/redis':   `REDIS_URL=rediss://default:${randHex(24)}@amazing-unicorn-${randHex(5)}.upstash.io:6379`,
  'twilio/sms':      `TWILIO_ACCOUNT_SID=AC${randHex(16)}\nTWILIO_AUTH_TOKEN=${randHex(16)}\nTWILIO_PHONE_NUMBER=+1555${randNum(6)}`,
  'vercel/hosting':  `VERCEL_TOKEN=vc_${randHex(20)}\nVERCEL_PROJECT_ID=prj_${randHex(12)}`,
  'clerk/auth':      `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_${randHex(24)}\nCLERK_SECRET_KEY=sk_test_${randHex(24)}`,
  'supabase/db':     `SUPABASE_URL=https://${randHex(10)}.supabase.co\nSUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${randB64(24)}.${randB64(32)}`,
  'runloop/sandbox': `RUNLOOP_API_KEY=${randHex(24)}\nRUNLOOP_SANDBOX_ID=sb_${randHex(12)}`,
};

function randHex(n) {
  return Array.from({length: n}, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

function randNum(n) {
  return Array.from({length: n}, () => Math.floor(Math.random() * 10)).join('');
}

function randB64(n) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  return Array.from({length: n}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function runStripe(args) {
  return new Promise((resolve, reject) => {
    execFile(path.join(process.cwd(), 'bin/stripe'), args, {
      cwd: process.cwd(),
      timeout: 30000,
    }, (err, stdout, stderr) => {
      if (err && !stdout) return reject(new Error(stderr || err.message));
      resolve((stdout + stderr).trim());
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const { providers } = req.body;
  if (!Array.isArray(providers) || providers.length === 0) {
    return res.status(400).json({ error: 'Select at least one service.' });
  }

  const results = [];
  const errors = [];
  let envContent = '';

  for (const provider of providers) {
    const svc = DEMO_KEYS[provider];
    if (!svc) {
      errors.push({ provider, error: 'Unknown service' });
      continue;
    }

    try {
      if (!DEMO_MODE) {
        await runStripe(['projects', 'add', provider, '--yes']);
        try { envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8'); } catch {}
      } else {
        // Demo mode: simulate provisioning delay + generate realistic keys
        await new Promise(r => setTimeout(r, 600 + Math.random() * 800));
        envContent += (envContent ? '\n' : '') + svc;
      }

      results.push({
        provider,
        name: provider.split('/')[1],
        icon: svc.includes('DATABASE') ? '🐘' : svc.includes('REDIS') ? '⚡' : svc.includes('TWILIO') ? '💬' : svc.includes('VERCEL') ? '▲' : svc.includes('CLERK') ? '🔐' : svc.includes('SUPABASE') ? '⚡' : '🏖️',
        success: true,
        demo: DEMO_MODE,
      });
    } catch (err) {
      errors.push({ provider, error: err.message.slice(0, 200) });
    }
  }

  return res.status(200).json({
    success: errors.length === 0,
    provisioned: results,
    errors,
    env: envContent,
    mode: DEMO_MODE ? 'demo' : 'live',
    message: DEMO_MODE
      ? `🎭 Demo mode: ${results.length} service(s) simulated. Real usage provisions via Stripe Projects.`
      : `${results.length} service(s) provisioned successfully!`,
  });
}
