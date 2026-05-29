import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

const MODELOS = [
  'openrouter/auto',
  'nousresearch/hermes-3-llama-3.1-405b:free',
];

export async function POST(req) {
  const { usuario_id, mensagem_usuario, modo_noite, puxar } = await req.json();

  console.log('[conversas] usuario_id:', usuario_id, '| puxar:', puxar, '| mensagem:', mensagem_usuario);
  console.log('[conversas] OPENROUTER_API_KEY presente:', !!process.env.OPENROUTER_API_KEY);

  const [usuarioRows, historico, perfil] = await Promise.all([
    sql`SELECT nome FROM usuarios WHERE id = ${usuario_id}`,
    sql`SELECT mensagem_usuario, mensagem_ia FROM conversas
        WHERE usuario_id = ${usuario_id} AND mensagem_usuario != '[puxar]'
        ORDER BY timestamp DESC LIMIT 5`,
    sql`SELECT tipo, valor FROM perfil_usuario
        WHERE usuario_id = ${usuario_id}
        ORDER BY data_criacao ASC`,
  ]);

  const nome = usuarioRows[0]?.nome || 'amiga';

  const memoriaTexto = perfil.length > 0
    ? '\n\nCoisas que você sabe sobre essa pessoa: ' +
      perfil.map(p => `${p.tipo}: ${p.valor}`).join('; ')
    : '';
  console.log('[memoria] perfil carregado:', perfil.length, 'itens', memoriaTexto || '(vazio)');

  const systemPrompt = puxar
    ? `Você é um companheiro virtual atencioso de ${nome}, uma senhora de 91 anos. Você é um cuidador sempre presente e carinhoso. Faça uma fala espontânea e natural para iniciar conversa — pode perguntar como ela está se sentindo, contar uma curiosidade interessante, falar sobre algo do cotidiano, ou dizer algo acolhedor. Seja breve (1 a 2 frases), natural e sem formalidades. Português brasileiro informal. Varie sempre — não repita as mesmas formas de iniciar.${memoriaTexto}`
    : modo_noite
    ? `Você é um companheiro virtual carinhoso de ${nome}, uma senhora de 91 anos. É noite agora e ela acabou de dizer algo. Responda com muito carinho e calma, perguntando suavemente se ela está bem ou se precisa de algo. Seja muito breve (1 frase curta). Português brasileiro informal.${memoriaTexto}`
    : `Você é um companheiro virtual de uma senhora de 91 anos chamada ${nome}. Fale de forma natural, simples e afetuosa como um amigo próximo faria. NÃO use expressões repetitivas como "minha querida" ou "querida" a todo momento. Varie o tom: às vezes pergunte como ela está, às vezes conte uma curiosidade interessante, às vezes puxe assunto sobre o dia. Respostas curtas de 1 a 2 frases no máximo. Fale em português brasileiro informal.${memoriaTexto}`;

  const mensagensHistorico = historico.reverse().flatMap(c => [
    { role: 'user',      content: c.mensagem_usuario },
    { role: 'assistant', content: c.mensagem_ia },
  ]);

  const mensagens = [
    { role: 'system', content: systemPrompt },
    ...mensagensHistorico,
    { role: 'user', content: puxar ? '[inicie a conversa agora espontaneamente]' : mensagem_usuario },
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
    return Response.json({ resposta: puxar ? null : 'Tive um probleminha para responder. Tente de novo!' });
  }

  console.log('[conversas] Sucesso com modelo:', modeloUsado);

  const mensagem_ia = orData.choices[0].message.content.trim();
  console.log('[conversas] Resposta IA:', mensagem_ia);

  const mensagemSalva = puxar ? '[puxar]' : mensagem_usuario;
  await sql`INSERT INTO conversas (usuario_id, mensagem_usuario, mensagem_ia)
            VALUES (${usuario_id}, ${mensagemSalva}, ${mensagem_ia})`;

  // Extração de memória de longo prazo — apenas para mensagens reais do usuário
  if (!puxar && mensagem_usuario) {
    try {
      const promptExtracao = `Você é um extrator de informações pessoais. Analise a mensagem abaixo e extraia dados relevantes sobre a pessoa que falou.

Categorias possíveis: familiar, gosto, saúde, hábito, emoção, preferência, evento.

Exemplos:
- "meu neto Pedro veio me visitar" → {"dados": [{"tipo": "familiar", "valor": "neto chamado Pedro"}]}
- "adoro tomar café de manhã" → {"dados": [{"tipo": "gosto", "valor": "gosta de café de manhã"}]}
- "estou com dor no joelho" → {"dados": [{"tipo": "saúde", "valor": "dor no joelho"}]}
- "como vai você?" → {"dados": []}

Responda APENAS com o JSON válido, sem texto adicional, sem markdown.

Mensagem: "${mensagem_usuario}"`;

      const extractRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + process.env.OPENROUTER_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openrouter/auto',
          messages: [{ role: 'user', content: promptExtracao }],
        }),
      });
      const extractData = await extractRes.json();
      const raw = extractData.choices?.[0]?.message?.content ?? '';
      console.log('[memoria] resposta bruta:', raw);

      // Remove markdown code blocks se o modelo os incluir
      const jsonStr = raw.replace(/```json?\s*/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(jsonStr);

      if (Array.isArray(parsed.dados) && parsed.dados.length > 0) {
        for (const item of parsed.dados) {
          if (!item.tipo || !item.valor) continue;
          const tipo  = String(item.tipo).slice(0, 100);
          const valor = String(item.valor).slice(0, 500);

          // Deduplicação: não salva se já existe o mesmo tipo+valor para este usuário
          const existe = await sql`
            SELECT 1 FROM perfil_usuario
            WHERE usuario_id = ${usuario_id} AND tipo = ${tipo} AND valor = ${valor}
            LIMIT 1`;
          if (existe.length === 0) {
            await sql`INSERT INTO perfil_usuario (usuario_id, tipo, valor)
                      VALUES (${usuario_id}, ${tipo}, ${valor})`;
            console.log('[memoria] novo dado salvo:', tipo, '->', valor);
          } else {
            console.log('[memoria] já existe, ignorando:', tipo, '->', valor);
          }
        }
      } else {
        console.log('[memoria] nada relevante extraído');
      }
    } catch (e) {
      console.error('[memoria] erro na extração (não bloqueia resposta):', e.message);
    }
  }

  return Response.json({ resposta: mensagem_ia });
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuario_id = searchParams.get('usuario_id');
  const result = await sql`SELECT mensagem_usuario, mensagem_ia, timestamp FROM conversas
                            WHERE usuario_id = ${usuario_id} ORDER BY timestamp ASC`;
  return Response.json(result);
}
