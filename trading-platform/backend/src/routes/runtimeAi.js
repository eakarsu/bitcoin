import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.post('/analysis', authenticate, async (req, res, next) => {
  try {
    const prompt = String(req.body?.prompt || '').trim();
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL;
    const baseUrl = process.env.OPENROUTER_BASE_URL;
    if (!apiKey || !model || !baseUrl) throw new Error('OpenRouter runtime is not configured');
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, temperature: 0.2, messages: [
        { role: 'system', content: 'You are a cryptocurrency operational-risk reviewer. Give concise risks, evidence gaps, next actions, uncertainty, and required human review. Do not provide personalized financial advice.' },
        { role: 'user', content: prompt },
      ] }),
    });
    if (!response.ok) throw new Error(`OpenRouter returned ${response.status}`);
    const payload = await response.json();
    const output = String(payload?.choices?.[0]?.message?.content || '').trim();
    if (!output) throw new Error('OpenRouter returned an empty response');
    const saved = await pool.query(`INSERT INTO runtime_ai_results(user_id,feature,input,output,model)
      VALUES($1,'runtime-analysis',$2,$3,$4) RETURNING id`, [req.user.id, { prompt }, output, model]);
    res.json({ id: saved.rows[0].id, response: output, model, provider: 'openrouter' });
  } catch (error) { next(error); }
});
export default router;
