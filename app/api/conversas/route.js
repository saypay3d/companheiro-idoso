export const maxDuration = 30;

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function POST(req) {
  const { usuario_id, mensagem_usuario, modo_noite, puxar } = await req.json();

  const keyPreview = (process.env.GOOGLE_AI_KEY || '').slice(0, 10);
  console.log('[conversas] usuario_id:', usuario_id, '| puxar:', puxar);
  console.log('[conversas] API key preview:', keyPreview || '(VAZIA — variável não configurada!)');

  const [usuarioRows, historico, perfil] = await Promise.all([
    sql`SELECT nome FROM usuarios WHERE id = ${usuario_id}`,
    sql`SELECT mensagem_usuario, mensagem_ia FROM conversas
        WHERE usuario_id = ${usuario_id} AND mensagem_usuario != '[puxar]'
        ORDER BY timestamp DESC LIMIT 2`,
    sql`SELECT tipo, valor FROM perfil_usuario
        WHERE usuario_id = ${usuario_id}
        ORDER BY data_criacao ASC`,
  ]);

  let perfilCuidador = null;
  try {
    const rows = await sql`SELECT * FROM perfil_cuidador WHERE usuario_id = ${usuario_id}`;
    perfilCuidador = rows[0] ?? null;
  } catch (e) {
    console.warn('[perfil_cuidador] erro ao buscar:', e.message);
  }

  const nome = usuarioRows[0]?.nome || 'amiga';

  let perfilTexto = '';
  if (perfilCuidador) {
    const p = perfilCuidador;
    const partes = [
      p.nome_completo         && `Nome: ${p.nome_completo}`,
      p.idade                 && `Idade: ${p.idade} anos`,
      p.apelido               && `Apelido: ${p.apelido}`,
      p.condicao_fisica       && `Condição física: ${p.condicao_fisica}`,
      p.doencas               && `Doenças: ${p.doencas}`,
      p.medicamentos          && `Medicamentos: ${p.medicamentos}`,
      p.limitacoes_fisicas    && `Limitações físicas: ${p.limitacoes_fisicas}`,
      p.limitacoes_cognitivas && `Limitações cognitivas: ${p.limitacoes_cognitivas}`,
      p.rotina_diaria         && `Rotina diária: ${p.rotina_diaria}`,
      p.nomes_filhos          && `Filhos: ${p.nomes_filhos}`,
      p.nomes_netos           && `Netos: ${p.nomes_netos}`,
      p.outros_familiares     && `Outros familiares: ${p.outros_familiares}`,
      p.nome_cuidador         && `Cuidador: ${p.nome_cuidador}`,
      p.assuntos_gosta        && `Assuntos que gosta: ${p.assuntos_gosta}`,
      p.assuntos_evitar       && `Assuntos a evitar: ${p.assuntos_evitar}`,
      p.comidas_favoritas     && `Comidas favoritas: ${p.comidas_favoritas}`,
      p.programas_tv          && `Programas de TV favoritos: ${p.programas_tv}`,
      p.musicas               && `Músicas que gosta: ${p.musicas}`,
      p.religiao              && `Religião: ${p.religiao}`,
      p.observacoes           && `Observações: ${p.observacoes}`,
    ].filter(Boolean);

    if (partes.length > 0) {
      const textoCompleto = partes.join('\n');
      const textoCortado = textoCompleto.length > 300 ? textoCompleto.slice(0, 300) + '...' : textoCompleto;
      perfilTexto = '\n\nInformações sobre essa pessoa:\n' + textoCortado;
    }
  }

  console.log('[perfil_cuidador] carregado:', !!perfilCuidador, '| campos preenchidos:', perfilTexto ? perfilTexto.split('\n').length - 2 : 0);

  const memoriaTexto = perfil.length > 0
    ? '\n\nMemórias aprendidas sobre essa pessoa:\n' +
      perfil.map(p => `${p.tipo}: ${p.valor}`).join('\n')
    : '';

  console.log('[memoria] itens:', perfil.length);

  const instrucaoEnvio = ' Se o usuário pedir para mandar mensagem para alguém, pergunte o que quer dizer, depois repita a mensagem e pergunte se pode enviar. Se confirmar, responda exatamente neste formato sem mais nada: ENVIAR_MSG:nome:mensagem. Responda em no máximo 15 palavras de forma direta e natural.';

  const systemPrompt = puxar
    ? `Você é um companheiro virtual atencioso de ${nome}, uma senhora de 91 anos. Faça uma fala espontânea e natural para iniciar conversa. Responda em no máximo 15 palavras. Português brasileiro informal. Varie sempre.${perfilTexto}${memoriaTexto}`
    : modo_noite
    ? `Você é um companheiro virtual carinhoso de ${nome}, uma senhora de 91 anos. É noite. Responda com carinho e calma, 1 frase curta. Português brasileiro informal.${perfilTexto}${memoriaTexto}${instrucaoEnvio}`
    : `Você é um companheiro virtual de uma senhora de 91 anos chamada ${nome}. Fale de forma natural, simples e afetuosa. NÃO use "minha querida" a todo momento. Respostas de 1 a 2 frases. Português brasileiro informal.${perfilTexto}${memoriaTexto}${instrucaoEnvio}`;

  const systemPromptFinal = systemPrompt.length > 500 ? systemPrompt.slice(0, 500) : systemPrompt;
  console.log('[conversas] system prompt chars:', systemPromptFinal.length);

  const contentsHistorico = historico.reverse().flatMap(c => [
    { role: 'user',  parts: [{ text: c.mensagem_usuario }] },
    { role: 'model', parts: [{ text: c.mensagem_ia }] },
  ]);

  const contents = [
    ...contentsHistorico,
    { role: 'user', parts: [{ text: puxar ? '[inicie a conversa agora espontaneamente]' : mensagem_usuario }] },
  ];

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + process.env.GOOGLE_AI_KEY;

  let orRes, rawText, data;

  try {
    orRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPromptFinal }] },
        contents,
        generationConfig: { maxOutputTokens: 150 },
      }),
    });
  } catch (fetchErr) {
    console.error('[conversas] Erro de rede:', fetchErr.message);
    return Response.json({
      resposta: puxar ? null : 'Tive um probleminha para responder. Tente de novo!',
      debug: { erro: fetchErr.message },
    });
  }

  console.log('[conversas] HTTP', orRes.status, orRes.statusText);

  try {
    rawText = await orRes.text();
  } catch (e) {
    console.error('[conversas] Erro ao ler body:', e.message);
    return Response.json({ resposta: puxar ? null : 'Tive um probleminha para responder. Tente de novo!', debug: { erro: e.message } });
  }

  if (!rawText || rawText.trim() === '') {
    console.error('[conversas] Body vazio');
    return Response.json({ resposta: puxar ? null : 'Tive um probleminha para responder. Tente de novo!', debug: { erro: 'body vazio' } });
  }

  try {
    data = JSON.parse(rawText);
  } catch (e) {
    console.error('[conversas] JSON inválido:', rawText.slice(0, 400));
    return Response.json({ resposta: puxar ? null : 'Tive um probleminha para responder. Tente de novo!', debug: { erro: 'JSON inválido', body: rawText.slice(0, 400) } });
  }

  const conteudo = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!orRes.ok || !conteudo || conteudo.trim().length === 0) {
    console.error('[conversas] Sem conteúdo válido:', rawText.slice(0, 400));
    return Response.json({
      resposta: puxar ? null : 'Tive um probleminha para responder. Tente de novo!',
      debug: { status: orRes.status, body: rawText.slice(0, 400) },
    });
  }

  const mensagem_ia = conteudo.trim();
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

    fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + process.env.GOOGLE_AI_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: promptExtracao }] }],
      }),
    })
      .then(r => r.json())
      .then(async extractData => {
        const raw = extractData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
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
