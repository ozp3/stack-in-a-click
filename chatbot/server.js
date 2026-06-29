const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || '';
const SYSTEM_PROMPT = fs.readFileSync(path.join(__dirname, 'system-prompt.txt'), 'utf-8');

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', services: 57 }));

// Main chat endpoint
app.post('/chat', async (req, res) => {
  const { message, history } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ error: 'Empty message' });
  }

  try {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(history || []).slice(-10).map(m => ({
        role: m.role, content: m.content
      })),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();

    if (!data.choices?.[0]?.message?.content) {
      throw new Error(data.error?.message || 'No response from DeepSeek');
    }

    const result = JSON.parse(data.choices[0].message.content);

    // Validate result
    if (!result.action || !['select','deselect','provision','chat'].includes(result.action)) {
      result.action = 'chat';
    }
    if (!Array.isArray(result.providers)) {
      result.providers = [];
    }
    if (!result.message) {
      result.message = 'Got it!';
    }

    return res.json(result);

  } catch (err) {
    console.error('Chat error:', err.message);
    return res.status(200).json({
      action: 'chat',
      providers: [],
      message: '⚠️ Bir şeyler ters gitti. Tekrar dener misin? (' + err.message.slice(0, 80) + ')'
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Hermes Chatbot running on :${PORT}`);
});
