// API: POST /api/chat — Hermes Stack Assistant
// Proxies to DeepSeek API with full catalog knowledge

const fs = require('fs');
const path = require('path');

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || '';
const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, 'catalog.json'), 'utf-8'));

function buildSystemPrompt() {
  const services = [];
  for (const [cat, d] of Object.entries(catalog.categories)) {
    for (const s of d.services) {
      services.push(`${s.id} | ${s.name} | ${s.desc} | ${s.tier} | ${cat}`);
    }
  }

  const templates = Object.entries(catalog.templates).map(([id, t]) =>
    `${id}: ${t.name} — ${t.desc} → ${t.services.join(', ')}`
  );

  return `You are the Hermes Stack Assistant for Stack-in-a-Click — a tool that provisions SaaS services via Stripe Projects.

## AVAILABLE SERVICES (${catalog.total_services} total)
${services.join('\n')}

## QUICK-START TEMPLATES
${templates.join('\n')}

## RULES
1. ALWAYS respond in JSON: {"action":"select|deselect|provision|chat","providers":["provider/service"],"message":"user-facing reply"}
2. When user describes needs → match to services → action:"select"
3. When user says "remove X" → action:"deselect"
4. When user says "provision"/"deploy"/"go"/"do it" → action:"provision"
5. When user just chats → action:"chat"
6. Messages SHORT (1-2 sentences). Use emojis. Respond in English.

## EXAMPLES
User: "I need auth and database"
→ {"action":"select","providers":["clerk/auth","neon/postgres"],"message":"✓ Clerk + Neon PostgreSQL selected. Need hosting too?"}

User: "build a SaaS MVP"
→ {"action":"select","providers":["neon/postgres","clerk/auth","vercel/project","posthog/analytics"],"message":"🚀 SaaS MVP ready: Neon + Clerk + Vercel + PostHog"}

User: "add AI and vector DB"
→ {"action":"select","providers":["openrouter/api","upstash/vector"],"message":"✓ OpenRouter + Upstash Vector added."}

User: "do it" or "provision"
→ {"action":"provision","providers":[],"message":"⚡ Provisioning started!"}

User: "hello"
→ {"action":"chat","providers":[],"message":"Hey! 👋 What are you building?"}
`;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { message, history } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Empty message' });

  if (!DEEPSEEK_KEY) {
    return res.json({ action: 'chat', providers: [], message: 'Chatbot is offline — API key not configured.' });
  }

  try {
    const systemPrompt = buildSystemPrompt();
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).slice(-8),
      { role: 'user', content: message }
    ];

    const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_KEY}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      })
    });

    const data = await resp.json();
    if (!data.choices?.[0]?.message?.content) {
      throw new Error(data.error?.message || 'No response');
    }

    const result = JSON.parse(data.choices[0].message.content);
    result.action = ['select','deselect','provision','chat'].includes(result.action) ? result.action : 'chat';
    result.providers = Array.isArray(result.providers) ? result.providers : [];
    result.message = result.message || 'Done!';

    return res.json(result);

  } catch (err) {
    return res.json({
      action: 'chat', providers: [],
      message: 'Something went wrong — try again?'
    });
  }
}
