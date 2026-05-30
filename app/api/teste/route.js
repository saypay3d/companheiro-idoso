const MODELOS = [
  'google/gemma-4-31b-it:free',
  'deepseek/deepseek-v4-flash:free',
  'nousresearch/hermes-3-llama-3.1-405b:free',
  'mistralai/mistral-7b-instruct:free',
  'meta-llama/llama-3.1-8b-instruct:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'qwen/qwen-2-7b-instruct:free',
  'microsoft/phi-3-mini-128k-instruct:free',
  'google/gemma-2-9b-it:free',
  'openchat/openchat-7b:free',
];

export async function GET() {
  const url = 'https://openrouter.ai/api/v1/chat/completions';
  const resultados = [];

  for (const modelo of MODELOS) {
    let status, rawText, parsed;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + process.env.OPENROUTER_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelo,
          messages: [{ role: 'user', content: 'oi' }],
          max_tokens: 20,
        }),
      });
      status = res.status;
      rawText = await res.text();
      try { parsed = JSON.parse(rawText); } catch { parsed = null; }
    } catch (err) {
      resultados.push({ modelo, status: 'network_error', erro: err.message });
      continue;
    }

    const conteudo = parsed?.choices?.[0]?.message?.content;
    resultados.push({ modelo, status, resposta: conteudo ?? null, body: parsed ?? rawText });

    if (status === 200 && conteudo) {
      return Response.json({ sucesso: modelo, resultados });
    }
  }

  return Response.json({ sucesso: null, resultados });
}
