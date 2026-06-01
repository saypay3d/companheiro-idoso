export async function GET() {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + process.env.GOOGLE_AI_KEY;

  let status, rawText, parsed;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'oi' }] }],
        generationConfig: { maxOutputTokens: 20 },
      }),
    });
    status = res.status;
    rawText = await res.text();
    try { parsed = JSON.parse(rawText); } catch { parsed = null; }
  } catch (err) {
    return Response.json({ sucesso: false, erro: err.message });
  }

  const conteudo = parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  return Response.json({ sucesso: status === 200 && !!conteudo, status, resposta: conteudo, body: parsed ?? rawText });
}
