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

  const MODELOS = ['deepseek/deepseek-v4-flash:free', 'google/gemma-4-31b-it:free'];
  const mensagens = [{ role: 'user', content: `${systemPrompt}\n\n${mensagem}` }];

  let orData = null;
  let modeloUsado = null;

  for (const modelo of MODELOS) {
    const body = { model: modelo, messages: mensagens };
    console.log('[conversas] Tentando modelo:', modelo);

    const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.OPENROUTER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('[conversas] Status:', orRes.status, 'modelo:', modelo);
    const data = await orRes.json();
    console.log('[conversas] Resposta:', JSON.stringify(data));

    if (orRes.ok && data.choices?.[0]?.message?.content) {
      orData = data;
      modeloUsado = modelo;
      break;
    }

    console.error('[conversas] Falhou com', modelo, '— tentando próximo');
  }

  if (!orData) {
    console.error('[conversas] Todos os modelos falharam');
    return Response.json(
      { resposta: 'Tive um probleminha para responder. Tente de novo!' },
      { status: 200 }
    );
  }

  console.log('[conversas] Sucesso com modelo:', modeloUsado);

  const mensagem_ia = orData.choices[0].message.content.trim();
  console.log('[conversas] Resposta IA:', mensagem_ia);

  await sql`INSERT INTO conversas (usuario_id, mensagem_usuario, mensagem_ia) VALUES (${usuario_id}, ${mensagem_usuario}, ${mensagem_ia})`;

  return Response.json({ resposta: mensagem_ia });
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuario_id = searchParams.get('usuario_id');
  const result = await sql`SELECT mensagem_usuario, mensagem_ia, timestamp FROM conversas WHERE usuario_id = ${usuario_id} ORDER BY timestamp ASC`;
  return Response.json(result);
}
