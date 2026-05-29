import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function POST(req) {
  const { usuario_id, mensagem_usuario, modo_noite } = await req.json();

  console.log('[conversas] usuario_id:', usuario_id, 'mensagem:', mensagem_usuario);
  console.log('[conversas] OPENROUTER_API_KEY presente:', !!process.env.OPENROUTER_API_KEY);

  const [usuarioRows, historico] = await Promise.all([
    sql`SELECT nome FROM usuarios WHERE id = ${usuario_id}`,
    sql`SELECT mensagem_usuario, mensagem_ia FROM conversas WHERE usuario_id = ${usuario_id} ORDER BY timestamp DESC LIMIT 5`,
  ]);

  const nome = usuarioRows[0]?.nome || 'amiga';

  const systemPrompt = modo_noite
    ? `Você é um companheiro virtual carinhoso de ${nome}, uma senhora de 91 anos. É noite agora e ela acabou de dizer algo. Responda com muito carinho e calma, perguntando suavemente se ela está bem ou se precisa de algo. Seja muito breve (1 frase curta). Português brasileiro informal.`
    : `Você é um companheiro virtual de uma senhora de 91 anos chamada ${nome}. Fale de forma natural, simples e afetuosa como um amigo próximo faria. NÃO use expressões repetitivas como "minha querida" ou "querida" a todo momento. Varie o tom: às vezes pergunte como ela está, às vezes conte uma curiosidade interessante, às vezes puxe assunto sobre o dia. Respostas curtas de 1 a 2 frases no máximo. Fale em português brasileiro informal.`;

  const mensagensHistorico = historico.reverse().flatMap(c => [
    { role: 'user', content: c.mensagem_usuario },
    { role: 'assistant', content: c.mensagem_ia },
  ]);

  const mensagens = [
    { role: 'system', content: systemPrompt },
    ...mensagensHistorico,
    { role: 'user', content: mensagem_usuario },
  ];

  const MODELOS = [
    'deepseek/deepseek-v4-flash:free',
    'google/gemma-4-31b-it:free',
    'meta-llama/llama-4-maverick:free',
  ];

  let orData = null;
  let modeloUsado = null;

  for (const modelo of MODELOS) {
    console.log('[conversas] Tentando modelo:', modelo);
    let orRes, data;
    try {
      orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + process.env.OPENROUTER_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: modelo, messages: mensagens }),
      });
      data = await orRes.json();
    } catch (fetchErr) {
      console.error('[conversas] Erro de rede com', modelo, ':', fetchErr.message);
      continue;
    }

    console.log('[conversas] Status:', orRes.status, '| modelo:', modelo);
    console.log('[conversas] Body:', JSON.stringify(data));

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
