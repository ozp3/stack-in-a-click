// API: GET /api/services
export default function handler(req, res) {
  const services = {
    'neon/postgres':   { name: 'Neon PostgreSQL', icon: '🐘', tier: 'free', desc: 'Serverless Postgres' },
    'upstash/redis':   { name: 'Upstash Redis',   icon: '⚡', tier: 'free', desc: 'Serverless Redis' },
    'twilio/sms':      { name: 'Twilio SMS',      icon: '💬', tier: 'payg', desc: 'Programmable SMS' },
    'vercel/hosting':  { name: 'Vercel Hosting',  icon: '▲', tier: 'free', desc: 'Frontend deployment' },
    'clerk/auth':      { name: 'Clerk Auth',      icon: '🔐', tier: 'free', desc: 'User authentication' },
    'supabase/db':     { name: 'Supabase',        icon: '⚡', tier: 'free', desc: 'Postgres + Auth + Storage' },
    'runloop/sandbox': { name: 'Runloop Sandbox', icon: '🏖️', tier: 'payg', desc: 'Cloud dev sandbox' },
  };
  res.status(200).json({ services });
}
