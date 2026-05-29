import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// openrouter/auto primeiro — roteamento automático é mais robusto
const MODELOS = [
  'openrouter/auto',
  'deepseek/deepseek-v4-flash:free',
];

const LABELS_CAMPO = {
  filhos:            'filhos',
  netos:             'netos',
  outros_familiares: 'outros familiares importantes',
  nome_cuidador:     'cuidador',
  assuntos_gosta:    'assuntos que gosta de conversar',
  assuntos_evitar:   'assuntos que deve evitar na conversa',
  comidas_favoritas: 'comidas favoritas',
  programas_tv:      'programas de TV favoritos',
  musicas:           'músicas que gosta',
  religiao:          'religião',
  observacoes:       'observações extras',
};

export async function POST(req) {
  const { usuario_id, mensagem_usuario, modo_noite, puxar } = await req.json();

  console.log('[conversas] usuario_id:', usuario_id, '| puxar:', puxar, '| mensagem:', mensagem_usuario);
  console.log('[conversas] OPENROUTER_API_KEY presente:', !!process.env.OPENROUTER_API_KEY);

  const [usuarioRows, historico, perfil, perfilCompleto] = await Promise.all([
    sql`SELECT nome FROM usuarios WHERE id = ${usuario_id}`,
    sql`SELECT mensagem_usuario, mensagem_ia FROM conversas
        WHERE usuario_id = ${usuario_id} AND mensagem_usuario != '[puxar]'
        ORDER BY timestamp DESC LIMIT 3`,
    sql`SELECT tipo, valor FROM perfil_usuario
        WHERE usuario_id = ${usuario_id}
        ORDER BY data_criacao ASC`,
    sql`SELECT campo, valor FROM perfil_completo
        WHERE usuario_id = ${usuario_id} AND valor != ''
        ORDER BY campo ASC`,
  ]);

  const nome = usuarioRows[0]?.nome || 'amiga';

  // Limita a 500 chars para não inflar o prompt
  const perfilBruto = perfilCompleto.length > 0
    ? perfilCompleto.map(p => `${LABELS_CAMPO[p.campo] || p.campo}: ${p.valor}`).join('; ')
    : '';
  const perfilTruncado = perfilBruto.length > 500 ? perfilBruto.slice(0, 500) + '...' : perfilBruto;
  const perfilTexto = perfilTruncado
    ? '\n\nInformações sobre essa pessoa (use naturalmente quando relevante, sem parecer que lê uma ficha): ' + perfilTruncado
    : '';

  // Limita memória dinâmica a 300 chars
  const memoriaBruta = perfil.length > 0
    ? perfil.map(p => `${p.tipo}: ${p.valor}`).join('; ')
    : '';
  const memoriaTruncada = memoriaBruta.length > 300 ? memoriaBruta.slice(0, 300) + '...' : memoriaBruta;
  const memoriaTexto = memoriaTruncada
    ? '\n\nAprendeu nas conversas anteriores: ' + memoriaTruncada
    : '';

  console.log('[perfil-completo] campos:', perfilCompleto.length, '| chars:', perfilTruncado.length);
  console.log('[memoria] itens:', perfil.length, '| chars:', memoriaTruncada.length);

  const instrucaoEnvio = ' Se o usuário pedir para mandar mensagem para alguém, pergunte o que quer dizer, depois repita a mensagem e pergunte se pode enviar. Se confirmar, responda exatamente neste formato sem mais nada: ENVIAR_MSG:nome:mensagem. Responda em no máximo 15 palavras de forma direta e natural.';

  const systemPrompt = puxar
    ? `Você é um companheiro virtual atencioso de ${nome}, uma senhora de 91 anos. Faça uma fala espontânea e natural para iniciar conversa. Responda em no máximo 15 palavras. Português brasileiro informal. Varie sempre.${perfilTexto}${memoriaTexto}`
    : modo_noite
    ? `Você é um companheiro virtual carinhoso de ${nome}, uma senhora de 91 anos. É noite. Responda com carinho e calma, 1 frase curta. Português brasileiro informal.${perfilTexto}${memoriaTexto}${instrucaoEnvio}`
    : `Você é um companheiro virtual de uma senhora de 91 anos chamada ${nome}. Fale de forma natural, simples e afetuosa. NÃO use "minha querida" a todo momento. Respostas de 1 a 2 frases. Português brasileiro informal.${perfilTexto}${memoriaTexto}${instrucaoEnvio}`;

  console.log('[conversas] system prompt total chars:', systemPrompt.length);

  const mensagensHistorico = historico.reverse().flatMap(c => [
    { role: 'user',      content: c.mensagem_usuario },
    { role: 'assistant', content: c.mensagem_ia },
  ]);

  const mensagens = [
    { role: 'system', content: systemPrompt },
    ...mensagensHistorico,
    { role: 'user', content: puxar ? '[inicie a conversa agora espontaneamente]' : mensagem_usuario },
  ];

  const erros = [];
  let orData = null;
  let modeloUsado = null;

  for (const modelo of MODELOS) {
    console.log('[conversas] Tentando modelo:', modelo);
    let orRes, rawText, data;
    try {
      orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + process.env.OPENROUTER_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: modelo, messages: mensagens, max_tokens: 150 }),
      });
      rawText = await orRes.text();
      data = JSON.parse(rawText);
    } catch (err) {
      const detalhe = {
        modelo,
        status: orRes?.status ?? 'network_error',
        statusText: orRes?.statusText ?? '',
        erro: err.message,
        body: rawText?.slice(0, 400) ?? '',
      };
      console.error('[conversas] Erro de rede/parse com', modelo, JSON.stringify(detalhe));
      erros.push(detalhe);
      continue;
    }

    console.log('[conversas] HTTP', orRes.status, '| modelo:', modelo);

    const conteudo = data.choices?.[0]?.message?.content;
    if (orRes.ok && conteudo && conteudo.trim().length > 0) {
      orData = data;
      modeloUsado = modelo;
      console.log('[conversas] Sucesso com modelo:', modeloUsado, '| resposta:', conteudo.trim());
      break;
    }

    const detalhe = {
      modelo,
      status: orRes.status,
      statusText: orRes.statusText,
      erro: data.error?.message ?? data.error?.code ?? '(sem campo error)',
      choices0: JSON.stringify(data.choices?.[0] ?? null),
      body: rawText?.slice(0, 400),
    };
    console.error('[conversas] Falhou com', modelo, JSON.stringify(detalhe));
    erros.push(detalhe);
  }

  if (!orData) {
    console.error('[conversas] Todos os modelos falharam:', JSON.stringify(erros));
    return Response.json({
      resposta: puxar ? null : 'Tive um probleminha para responder. Tente de novo!',
      debug: { erros },
    });
  }

  const mensagem_ia = orData.choices[0].message.content.trim();
  console.log('[conversas] Resposta IA:', mensagem_ia);

  const mensagemSalva = puxar ? '[puxar]' : mensagem_usuario;
  await sql`INSERT INTO conversas (usuario_id, mensagem_usuario, mensagem_ia)
            VALUES (${usuario_id}, ${mensagemSalva}, ${mensagem_ia})`;

  // Extração de memória — fire-and-forget
  if (!puxar && mensagem_usuario) {
    const promptExtracao = `Você é um extrator de informações pessoais. Analise a mensagem abaixo e extraia dados relevantes sobre a pessoa que falou.

Categorias possíveis: familiar, gosto, saúde, hábito, emoção, preferência, evento.

Exemplos:
- "meu neto Pedro veio me visitar" → {"dados": [{"tipo": "familiar", "valor": "neto chamado Pedro"}]}
- "adoro tomar café de manhã" → {"dados": [{"tipo": "gosto", "valor": "gosta de café de manhã"}]}
- "estou com dor no joelho" → {"dados": [{"tipo": "saúde", "valor": "dor no joelho"}]}
- "como vai você?" → {"dados": []}

Responda APENAS com o JSON válido, sem texto adicional, sem markdown.

Mensagem: "${mensagem_usuario}"`;

    fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.OPENROUTER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openrouter/auto',
        messages: [{ role: 'user', content: promptExtracao }],
      }),
    })
      .then(r => r.json())
      .then(async extractData => {
        const raw = extractData.choices?.[0]?.message?.content ?? '';
        console.log('[memoria] resposta bruta:', raw);
        const jsonStr = raw.replace(/```json?\s*/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(jsonStr);
        if (!Array.isArray(parsed.dados) || parsed.dados.length === 0) {
          console.log('[memoria] nada relevante extraído');
          return;
        }
        for (const item of parsed.dados) {
          if (!item.tipo || !item.valor) continue;
          const tipo  = String(item.tipo).slice(0, 100);
          const valor = String(item.valor).slice(0, 500);
          const existe = await sql`
            SELECT 1 FROM perfil_usuario
            WHERE usuario_id = ${usuario_id} AND tipo = ${tipo} AND valor = ${valor} LIMIT 1`;
          if (existe.length === 0) {
            await sql`INSERT INTO perfil_usuario (usuario_id, tipo, valor)
                      VALUES (${usuario_id}, ${tipo}, ${valor})`;
            console.log('[memoria] novo dado salvo:', tipo, '->', valor);
          } else {
            console.log('[memoria] já existe, ignorando:', tipo, '->', valor);
          }
        }
      })
      .catch(e => console.error('[memoria] erro na extração:', e.message));
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
