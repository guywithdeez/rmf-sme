export const config = { runtime: 'edge' };

const SYSTEM_PROMPT = `You are an elite Subject Matter Expert (SME) in the NIST Risk Management Framework (RMF), with deep expertise in:
- NIST SP 800-37 Rev. 2, NIST SP 800-53 Rev. 5, NIST SP 800-53A, FIPS 199/200
- FISMA, FedRAMP, NIST SP 800-171, NIST SP 800-30, DISA STIGs and SCAP compliance
- ATO processes, SSPs, SARs, POA&Ms, Continuous Monitoring
Format responses with ALL CAPS section headers, cite controls like [AC-2], number steps. Be direct and comprehensive.`;

const MODELS = {
  claude: 'claude-sonnet-4-6',
  gpt4o:  'gpt-4o',
  gemini: 'gemini-2.5-flash-preview-05-20',
};

async function callClaude(messages, apiKey) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODELS.claude, max_tokens: 1024, system: SYSTEM_PROMPT, messages: messages.slice(-20) }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Claude error ${res.status}`);
  return data.content?.map(b => b.text || '').join('') || '';
}

async function callGPT4o(messages, apiKey) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODELS.gpt4o, max_tokens: 1024,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages.slice(-20)],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `OpenAI error ${res.status}`);
  return data.choices?.[0]?.message?.content || '';
}

async function callGemini(messages, apiKey) {
  const contents = messages.slice(-20).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODELS.gemini}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { maxOutputTokens: 1024 },
      }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Gemini error ${res.status}`);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function smartRoute(messages) {
  const msg = (messages[messages.length - 1]?.content || '').toLowerCase();
  // Gemini: large document analysis, cross-referencing
  if (['upload','pdf','document','summarize','find in','search through','entire ssp','cross-reference','appendix'].some(k => msg.includes(k)))
    return 'gemini';
  // Claude: precise NIST control writing, STIG analysis
  if (['800-53','control implementation','implementation statement','cci-','stig','ckl','scap','poam','ato package','nist control','control mapping'].some(k => msg.includes(k)))
    return 'claude';
  if (/\b[a-z]{2,3}-\d+/i.test(msg)) return 'claude';
  // GPT-4o: quick questions, definitions, general RMF
  return 'gpt4o';
}

export default async function handler(req) {
  if (req.method !== 'POST')
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });

  let body;
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { 'Content-Type': 'application/json' } }); }

  const { messages, model: requestedModel = 'claude' } = body;
  if (!messages || !Array.isArray(messages) || !messages.length)
    return new Response(JSON.stringify({ error: 'Messages array required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

  const selectedModel = requestedModel === 'smart' ? smartRoute(messages) : requestedModel;

  const keyMap = { claude: process.env.ANTHROPIC_API_KEY, gpt4o: process.env.OPENAI_API_KEY, gemini: process.env.GOOGLE_AI_KEY };
  const apiKey = keyMap[selectedModel];

  if (!apiKey)
    return new Response(JSON.stringify({ error: `No API key for "${selectedModel}". Add ${selectedModel === 'gpt4o' ? 'OPENAI_API_KEY' : selectedModel === 'gemini' ? 'GOOGLE_AI_KEY' : 'ANTHROPIC_API_KEY'} in Vercel Environment Variables.` }), { status: 500, headers: { 'Content-Type': 'application/json' } });

  try {
    let reply = '';
    if (selectedModel === 'claude') reply = await callClaude(messages, apiKey);
    if (selectedModel === 'gpt4o')  reply = await callGPT4o(messages, apiKey);
    if (selectedModel === 'gemini') reply = await callGemini(messages, apiKey);
    return new Response(JSON.stringify({ reply, usedModel: selectedModel }), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
