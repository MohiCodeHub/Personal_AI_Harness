import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT) || 3001;
const MODEL = process.env.OPENAI_MODEL || 'gpt-5';

const apiKey = process.env.OPENAI_API_KEY;
const keyConfigured =
  Boolean(apiKey) && apiKey !== 'your-openai-api-key-here';
const client = keyConfigured ? new OpenAI({ apiKey }) : null;

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

// Liveness / config check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', model: MODEL, keyConfigured });
});

// Chat completion against the configured OpenAI model
app.post('/api/chat', async (req, res) => {
  if (!client) {
    return res.status(500).json({
      error:
        'OPENAI_API_KEY is not configured. Add your key to backend/.env and restart.',
    });
  }

  const { messages } = (req.body ?? {}) as { messages?: ChatMessage[] };
  if (!Array.isArray(messages) || messages.length === 0) {
    return res
      .status(400)
      .json({ error: 'Request body must include a non-empty "messages" array.' });
  }

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages,
    });
    const reply = completion.choices[0]?.message?.content ?? '';
    res.json({ reply });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error.';
    console.error('OpenAI error:', message);
    res.status(500).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(
    `Krypto backend listening on http://localhost:${PORT} (model: ${MODEL}, key configured: ${keyConfigured})`
  );
});
