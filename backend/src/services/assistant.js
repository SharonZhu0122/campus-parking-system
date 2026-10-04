const { SYSTEM_PROMPT } = require('./assistantKnowledge');

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const MAX_QUESTION_LENGTH = 300;

class AssistantUnavailableError extends Error {}

async function askAssistant(question) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new AssistantUnavailableError('assistant is not configured');

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: question }] }],
      generationConfig: { maxOutputTokens: 400, temperature: 0.2 },
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) throw new AssistantUnavailableError(`model returned ${response.status}`);

  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  const answer = parts
    .map((part) => part.text || '')
    .join('')
    .trim();
  if (!answer) throw new AssistantUnavailableError('empty answer');
  return answer;
}

module.exports = { askAssistant, AssistantUnavailableError, MAX_QUESTION_LENGTH };
