import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

const MODELOS = ['deepseek/deepseek-v4-flash:free', 'google/gemma-4-31b-it:free'];

export async function POST(req) {
  const { usuario_id } = await req.json();

  const [usuarioRows, historico] = await Promise.all([
    sql`SELECT nome FROM usuarios WHERE id = ${usuario_id}`,
    sql`SELECT mensagem_usuario, mensagem_ia FROM conversas
        WHERE usuario_id = ${usuario_id} AND mensagem_usuario != '[puxar]'
        ORDER BY timestamp DESC LIMIT 5`,
  ]);

  const nome = usuarioRows[0]?.nome || 'amiga';

  const systemPrompt = `Você é um companheiro virtual atencioso de ${nome}, uma senhora de 91 anos. Você é um cuidador sempre presente e carinhoso. Faça uma fala espontânea e natural para iniciar conversa — pode perguntar como ela está se sentindo, contar uma curiosidade interessante, falar sobre algo do cotidiano, ou dizer algo acolhedor. Seja breve (1 a 2 frases), natural e sem formalidades. Português brasileiro informal. Varie sempre — não repita as mesmas formas de iniciar.`;

  const historicMessages = historico.reverse().flatMap(c => [
    { role: 'user',      content: c.mensagem_usuario },
    { role: 'assistant', content: c.mensagem_ia },
  ]);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...historicMessages,
    { role: 'user', content: '[inicie a conversa agora espontaneamente]' },
  ];

  let orData = null;
  let modeloUsado = null;

  for (const modelo of MODELOS) {
    const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.OPENROUTER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: modelo, messages }),
    });

    const data = await orRes.json();
    console.log('[puxar] status:', orRes.status, 'modelo:', modelo);

    if (orRes.ok && data.choices?.[0]?.message?.content) {
      orData = data;
      modeloUsado = modelo;
      break;
    }
    console.error('[puxar] falhou com', modelo, JSON.stringify(data));
  }

  if (!orData) {
    console.error('[puxar] todos os modelos falharam');
    return Response.json({ resposta: null });
  }

  const mensagem_ia = orData.choices[0].message.content.trim();
  console.log('[puxar] resposta:', mensagem_ia, '| modelo:', modeloUsado);

  await sql`INSERT INTO conversas (usuario_id, mensagem_usuario, mensagem_ia)
            VALUES (${usuario_id}, ${'[puxar]'}, ${mensagem_ia})`;

  return Response.json({ resposta: mensagem_ia });
}
