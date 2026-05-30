export async function GET() {
  const url = 'https://openrouter.ai/api/v1/chat/completions';
  const body = {
    model: 'deepseek/deepseek-v4-flash:free',
    messages: [{ role: 'user', content: 'oi' }],
    max_tokens: 20,
  };

  let status, rawText, parsed;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.OPENROUTER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    status = res.status;
    rawText = await res.text();
    try { parsed = JSON.parse(rawText); } catch { parsed = null; }
  } catch (err) {
    return Response.json({ erro: err.message, status: 'network_error' });
  }

  return Response.json({ status, body: parsed ?? rawText });
}
