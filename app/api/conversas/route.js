import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function POST(req) {
  const { usuario_id, mensagem_usuario } = await req.json();

  console.log('[conversas] usuario_id:', usuario_id, 'mensagem:', mensagem_usuario);
  console.log('[conversas] OPENROUTER_API_KEY presente:', !!process.env.OPENROUTER_API_KEY);
  console.log('[conversas] Primeiros 8 chars da key:', process.env.OPENROUTER_API_KEY?.slice(0, 8));

  const usuario = await sql`SELECT nome FROM usuarios WHERE id = ${usuario_id}`;
  const nome = usuario[0]?.nome || 'amiga';

  const systemPrompt = `Você é um companheiro amigável de uma senhora idosa de 91 anos chamada ${nome}. Responda de forma curta, carinhosa e em português.`;
  const mensagem = mensagem_usuario;

  const body = {
    model: 'google/gemma-3-4b-it:free',
    messages: [
      { role: 'user', content: `${systemPrompt}\n\n${mensagem}` },
    ],
  };

  console.log('[conversas] Enviando para OpenRouter:', JSON.stringify(body));

  const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + process.env.OPENROUTER_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  console.log('[conversas] Status OpenRouter:', orRes.status, orRes.statusText);

  const orData = await orRes.json();

  console.log('[conversas] Resposta OpenRouter:', JSON.stringify(orData));

  if (!orRes.ok || !orData.choices?.[0]?.message?.content) {
    console.error('[conversas] ERRO: resposta inválida do OpenRouter');
    return Response.json(
      { resposta: 'Tive um probleminha para responder. Tente de novo!' },
      { status: 200 }
    );
  }

  const mensagem_ia = orData.choices[0].message.content.trim();

  await sql`INSERT INTO conversas (usuario_id, mensagem_usuario, mensagem_ia) VALUES (${usuario_id}, ${mensagem_usuario}, ${mensagem_ia})`;

  console.log('[conversas] Sucesso! Resposta IA:', mensagem_ia);

  return Response.json({ resposta: mensagem_ia });
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuario_id = searchParams.get('usuario_id');
  const result = await sql`SELECT mensagem_usuario, mensagem_ia, timestamp FROM conversas WHERE usuario_id = ${usuario_id} ORDER BY timestamp ASC`;
  return Response.json(result);
}
