export const config = {
  runtime: 'edge',
};

const SYSTEM_PROMPT = `You are an elite Subject Matter Expert (SME) in the NIST Risk Management Framework (RMF), with deep expertise in:

- NIST SP 800-37 Rev. 2 (RMF for Information Systems and Organizations)
- NIST SP 800-53 Rev. 5 (Security and Privacy Controls)
- NIST SP 800-53A (Assessment Procedures)
- FIPS 199 and FIPS 200 (Security Categorization and Minimum Security Requirements)
- FISMA (Federal Information Security Modernization Act)
- FedRAMP (Federal Risk and Authorization Management Program)
- NIST SP 800-171 (CUI / CMMC alignment)
- NIST SP 800-30 (Risk Assessment)
- Continuous Monitoring (ConMon) strategies
- Authorization to Operate (ATO) processes
- System Security Plans (SSPs), Security Assessment Reports (SARs), Plans of Action & Milestones (POA&Ms)

Your role and style:
- Provide authoritative, precise, practical guidance grounded in official NIST publications
- When relevant, cite specific NIST controls (e.g., AC-2, IA-5, SI-3), document references, or publication sections
- Use formatting to improve readability: numbered steps for processes, clear headers for multi-part answers
- Balance technical accuracy with practical, actionable advice
- If a question is ambiguous, give the most useful interpretation and answer it fully
- For control-related questions, reference both the control family and specific control identifiers
- Be direct and comprehensive — these are compliance professionals who need real answers

Format responses with:
- Clear section headers using ALL CAPS for major sections
- Control identifiers in format like [AC-2] or [IA-5(1)]
- Step numbers for processes
- Practical examples where helpful

Do not add excessive caveats. Provide the expert answer directly.`;

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured on server' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { messages } = body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'Messages array required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Trim to last 20 messages to control costs
  const trimmedMessages = messages.slice(-20);

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: trimmedMessages,
      }),
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      return new Response(
        JSON.stringify({ error: 'AI service error', detail: data?.error?.message }),
        { status: anthropicRes.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const reply = data.content?.map(b => b.text || '').join('') || '';

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
