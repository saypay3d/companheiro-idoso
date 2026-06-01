const PROVEDORES = [
  { tipo: 'openrouter', modelo: 'google/gemma-4-31b-it:free' },
  { tipo: 'google',     modelo: 'gemini-2.0-flash' },
  { tipo: 'openrouter', modelo: 'deepseek/deepseek-v4-flash:free' },
  { tipo: 'openrouter', modelo: 'qwen/qwen3-4b:free' },
];

export async function GET() {
  const resultados = [];

  for (const provedor of PROVEDORES) {
    let fetchUrl, fetchHeaders, fetchBody;

    if (provedor.tipo === 'google') {
      fetchUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + provedor.modelo + ':generateContent?key=' + process.env.GOOGLE_AI_KEY;
      fetchHeaders = { 'Content-Type': 'application/json' };
      fetchBody = JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'oi' }] }],
        generationConfig: { maxOutputTokens: 20 },
      });
    } else {
      fetchUrl = 'https://openrouter.ai/api/v1/chat/completions';
      fetchHeaders = {
        'Authorization': 'Bearer ' + process.env.OPENROUTER_API_KEY,
        'Content-Type': 'application/json',
      };
      fetchBody = JSON.stringify({
        model: provedor.modelo,
        messages: [{ role: 'user', content: 'oi' }],
        max_tokens: 20,
      });
    }

    let status, rawText, parsed;
    try {
      const res = await fetch(fetchUrl, { method: 'POST', headers: fetchHeaders, body: fetchBody });
      status = res.status;
      rawText = await res.text();
      try { parsed = JSON.parse(rawText); } catch { parsed = null; }
    } catch (err) {
      resultados.push({ tipo: provedor.tipo, modelo: provedor.modelo, status: 'network_error', erro: err.message });
      continue;
    }

    const conteudo = provedor.tipo === 'google'
      ? parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? null
      : parsed?.choices?.[0]?.message?.content ?? null;

    resultados.push({ tipo: provedor.tipo, modelo: provedor.modelo, status, resposta: conteudo, body: parsed ?? rawText });

    if (status === 200 && conteudo) {
      return Response.json({ sucesso: provedor.modelo, resultados });
    }
  }

  return Response.json({ sucesso: null, resultados });
}
