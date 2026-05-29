import { neon } from '@neondatabase/serverless';

const SYSTEM_PROMPT = `Você é um companheiro virtual carinhoso, paciente e alegre para uma pessoa idosa.
Suas respostas devem ser:
- Curtas e simples (no máximo 3 frases)
- Em português brasileiro claro, sem abreviações
- Calorosas, encorajadoras e positivas
- Sem jargões técnicos ou palavras difíceis
- Sempre acolhedoras, nunca negativas ou críticas
Trate a pessoa com muito respeito, carinho e paciência.`;

export async function POST(req) {
  const sql = neon(process.env.DATABASE_URL);
  const { usuario_id, mensagem_usuario } = await req.json();

  const [usuario, historico] = await Promise.all([
    sql('SELECT nome FROM usuarios WHERE id = $1', [usuario_id]),
    sql(
      'SELECT mensagem_usuario, mensagem_ia FROM conversas WHERE usuario_id = $1 ORDER BY timestamp DESC LIMIT 8',
      [usuario_id]
    ),
  ]);

  const nome = usuario[0]?.nome || 'amigo';

  const messages = [
    { role: 'system', content: `${SYSTEM_PROMPT}\nO nome da pessoa é ${nome}.` },
    ...historico.reverse().flatMap(c => [
      { role: 'user', content: c.mensagem_usuario },
      { role: 'assistant', content: c.mensagem_ia },
    ]),
    { role: 'user', content: mensagem_usuario },
  ];

  const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://companheiro-idoso.vercel.app',
      'X-Title': 'Companheiro Idoso',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      messages,
      max_tokens: 512,
      temperature: 0.7,
    }),
  });

  const orData = await orRes.json();
  const mensagem_ia = orData.choices?.[0]?.message?.content ?? 'Desculpe, não consegui responder agora.';

  await sql(
    'INSERT INTO conversas (usuario_id, mensagem_usuario, mensagem_ia) VALUES ($1, $2, $3)',
    [usuario_id, mensagem_usuario, mensagem_ia]
  );

  return Response.json({ resposta: mensagem_ia });
}

export async function GET(req) {
  const sql = neon(process.env.DATABASE_URL);
  const { searchParams } = new URL(req.url);
  const usuario_id = searchParams.get('usuario_id');
  const result = await sql(
    'SELECT mensagem_usuario, mensagem_ia, timestamp FROM conversas WHERE usuario_id = $1 ORDER BY timestamp ASC',
    [usuario_id]
  );
  return Response.json(result);
}
