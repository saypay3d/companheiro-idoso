export const maxDuration = 30;

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

const PROVEDORES = [
  { tipo: 'openrouter', modelo: 'deepseek/deepseek-v4-flash' },
  { tipo: 'openrouter', modelo: 'google/gemma-4-31b-it:free' },
  { tipo: 'google',     modelo: 'gemini-2.0-flash' },
  { tipo: 'openrouter', modelo: 'deepseek/deepseek-v4-flash:free' },
  { tipo: 'openrouter', modelo: 'qwen/qwen3-4b:free' },
];

export async function POST(req) {
  const { usuario_id, mensagem_usuario, modo_noite, puxar } = await req.json();

  console.log('[conversas] usuario_id:', usuario_id, '| puxar:', puxar);

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
      perfilTexto = '\n\nInformações sobre essa pessoa:\n' + partes.join('\n');
    }
  }

  console.log('[perfil_cuidador] carregado:', !!perfilCuidador);

  const genero     = perfilCuidador?.genero;
  const tratamento = genero === 'Homem' ? 'senhor'    : 'senhora';
  const descricao  = genero === 'Homem' ? 'um senhor' : 'uma senhora';
  const chamadoA   = genero === 'Homem' ? 'chamado'   : 'chamada';

  const memoriaTexto = perfil.length > 0
    ? '\n\nMemórias aprendidas sobre essa pessoa:\n' +
      perfil.map(p => `${p.tipo}: ${p.valor}`).join('\n')
    : '';

  console.log('[memoria] itens:', perfil.length);

  const instrucaoEnvio = ' Se o usuário pedir para mandar mensagem para alguém, pergunte o que quer dizer, depois repita a mensagem e pergunte se pode enviar. Se confirmar, responda exatamente neste formato sem mais nada: ENVIAR_MSG:nome:mensagem. Responda em no máximo 15 palavras de forma direta e natural.';
  const instrucaoMemoria = `REGRA ABSOLUTA: NUNCA INVENTE INFORMAÇÕES SOBRE O USUÁRIO. NUNCA DIGA QUE ALGO ACONTECEU SE NÃO FOI DITO. SE NÃO SABE ALGO PERGUNTE EM VEZ DE INVENTAR. USE SOMENTE INFORMAÇÕES DO PERFIL E DAS MEMÓRIAS ABAIXO. SE O USUÁRIO MENCIONAR ANIMAIS DE ESTIMAÇÃO, NOMES DE PESSOAS, DATAS OU QUALQUER DADO PESSOAL, SEMPRE SALVE NA MEMÓRIA.`;

  const systemPrompt = puxar
    ? `${instrucaoMemoria}\n\nVocê é um companheiro virtual atencioso de ${nome}, ${descricao} de 91 anos. Trate-o(a) como ${tratamento}. Use os pronomes corretos: ${genero === 'Homem' ? 'ele, dele, para ele' : 'ela, dela, para ela'}. Faça uma fala espontânea e natural para iniciar conversa. Responda em no máximo 15 palavras. Português brasileiro informal. Varie sempre.${perfilTexto}${memoriaTexto}`
    : modo_noite
    ? `${instrucaoMemoria}\n\nVocê é um companheiro virtual carinhoso de ${nome}, ${descricao} de 91 anos. Trate-o(a) como ${tratamento}. Use os pronomes corretos: ${genero === 'Homem' ? 'ele, dele, para ele' : 'ela, dela, para ela'}. É noite. Responda com carinho e calma, 1 frase curta. Português brasileiro informal.${perfilTexto}${memoriaTexto}${instrucaoEnvio}`
    : `${instrucaoMemoria}\n\nVocê é um companheiro virtual de ${descricao} de 91 anos ${chamadoA} ${nome}. Trate-o(a) como ${tratamento}. Use os pronomes corretos: ${genero === 'Homem' ? 'ele, dele, para ele' : 'ela, dela, para ela'}. Fale de forma natural, simples e afetuosa. NÃO use "minha querida" a todo momento. Respostas de 1 a 2 frases. Português brasileiro informal.${perfilTexto}${memoriaTexto}${instrucaoEnvio}`;

  console.log('[conversas] system prompt completo:\n' + systemPrompt);

  const historicoOrdenado = historico.reverse();

  // Formato Google AI
  const contents = [
    ...historicoOrdenado.flatMap(c => [
      { role: 'user',  parts: [{ text: c.mensagem_usuario }] },
      { role: 'model', parts: [{ text: c.mensagem_ia }] },
    ]),
    { role: 'user', parts: [{ text: puxar ? '[inicie a conversa agora espontaneamente]' : mensagem_usuario }] },
  ];

  // Formato OpenRouter
  const mensagens = [
    { role: 'system', content: systemPrompt },
    ...historicoOrdenado.flatMap(c => [
      { role: 'user',      content: c.mensagem_usuario },
      { role: 'assistant', content: c.mensagem_ia },
    ]),
    { role: 'user', content: puxar ? '[inicie a conversa agora espontaneamente]' : mensagem_usuario },
  ];

  const erros = [];
  let respostaFinal = null;
  let provedorUsado = null;

  for (const provedor of PROVEDORES) {
    console.log('[conversas] Tentando:', provedor.tipo, provedor.modelo);

    let fetchUrl, fetchHeaders, fetchBody;

    if (provedor.tipo === 'google') {
      fetchUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + provedor.modelo + ':generateContent?key=' + process.env.GOOGLE_AI_KEY;
      fetchHeaders = { 'Content-Type': 'application/json' };
      fetchBody = JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: 150 },
      });
    } else {
      fetchUrl = 'https://openrouter.ai/api/v1/chat/completions';
      fetchHeaders = {
        'Authorization': 'Bearer ' + process.env.OPENROUTER_API_KEY,
        'Content-Type': 'application/json',
      };
      fetchBody = JSON.stringify({ model: provedor.modelo, messages: mensagens, max_tokens: 150 });
    }

    let res, rawText, data;

    try {
      res = await fetch(fetchUrl, { method: 'POST', headers: fetchHeaders, body: fetchBody });
    } catch (e) {
      erros.push({ modelo: provedor.modelo, tipo: provedor.tipo, erro: e.message });
      continue;
    }

    console.log('[conversas] HTTP', res.status, '|', provedor.modelo);

    if (res.status === 429) {
      erros.push({ modelo: provedor.modelo, tipo: provedor.tipo, status: 429 });
      await new Promise(r => setTimeout(r, 3000));
      continue;
    }

    try {
      rawText = await res.text();
      data = JSON.parse(rawText);
    } catch (e) {
      erros.push({ modelo: provedor.modelo, tipo: provedor.tipo, status: res.status, erro: e.message });
      continue;
    }

    const conteudo = provedor.tipo === 'google'
      ? data.candidates?.[0]?.content?.parts?.[0]?.text
      : data.choices?.[0]?.message?.content;

    if (res.ok && conteudo && conteudo.trim().length > 0) {
      respostaFinal = conteudo.trim();
      provedorUsado = provedor;
      console.log('[conversas] Sucesso com', provedor.modelo, '| resposta:', respostaFinal);
      break;
    }

    erros.push({ modelo: provedor.modelo, tipo: provedor.tipo, status: res.status, body: rawText?.slice(0, 200) });
  }

  if (!respostaFinal) {
    console.error('[conversas] Todos os provedores falharam:', JSON.stringify(erros));
    return Response.json({
      resposta: puxar ? null : 'Tive um probleminha para responder. Tente de novo!',
      debug: { erros },
    });
  }

  const mensagem_ia = respostaFinal;
  const mensagemSalva = puxar ? '[puxar]' : mensagem_usuario;
  await sql`INSERT INTO conversas (usuario_id, mensagem_usuario, mensagem_ia)
            VALUES (${usuario_id}, ${mensagemSalva}, ${mensagem_ia})`;

  // Extração de memória — mesmo modelo que respondeu
  if (!puxar && mensagem_usuario && provedorUsado) {
    const promptExtracao = `Extraia dados pessoais desta frase do usuario. Responda SOMENTE em JSON: {"dados":[{"tipo":string,"valor":string}]}. Se nao houver dados responda {"dados":[]}.
Exemplos:
- "meu cachorro se chama Rex" -> {"dados":[{"tipo":"animal","valor":"cachorro chamado Rex"}]}
- "tenho dois gatos" -> {"dados":[{"tipo":"animal","valor":"tem dois gatos"}]}
- "meu filho se chama Joao" -> {"dados":[{"tipo":"familiar","valor":"filho chamado Joao"}]}
- "adoro tomar cafe de manha" -> {"dados":[{"tipo":"gosto","valor":"gosta de cafe de manha"}]}
- "estou com dor no joelho" -> {"dados":[{"tipo":"saude","valor":"dor no joelho"}]}
- "como vai voce?" -> {"dados":[]}
Frase: ${mensagem_usuario}`;

    try {
      let extractUrl, extractHeaders, extractBody;
      if (provedorUsado.tipo === 'google') {
        extractUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + provedorUsado.modelo + ':generateContent?key=' + process.env.GOOGLE_AI_KEY;
        extractHeaders = { 'Content-Type': 'application/json' };
        extractBody = JSON.stringify({ contents: [{ role: 'user', parts: [{ text: promptExtracao }] }] });
      } else {
        extractUrl = 'https://openrouter.ai/api/v1/chat/completions';
        extractHeaders = { 'Authorization': 'Bearer ' + process.env.OPENROUTER_API_KEY, 'Content-Type': 'application/json' };
        extractBody = JSON.stringify({ model: provedorUsado.modelo, messages: [{ role: 'user', content: promptExtracao }], max_tokens: 200 });
      }

      const extractRes = await fetch(extractUrl, { method: 'POST', headers: extractHeaders, body: extractBody });
      const extractData = await extractRes.json();
      const raw = provedorUsado.tipo === 'google'
        ? extractData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
        : extractData.choices?.[0]?.message?.content ?? '';
      console.log('[memoria] resposta bruta:', raw);

      const jsonStr = raw.replace(/```json?\s*/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(jsonStr);

      if (Array.isArray(parsed.dados)) {
        for (const item of parsed.dados) {
          if (!item.tipo || !item.valor) continue;
          const tipo  = String(item.tipo).slice(0, 100);
          const valor = String(item.valor).slice(0, 500);
          await sql`INSERT INTO perfil_usuario (usuario_id, tipo, valor) VALUES (${usuario_id}, ${tipo}, ${valor})`;
          console.log('[memoria] salvo:', tipo, '->', valor);
        }
      }
    } catch (e) {
      console.error('[memoria] erro na extração:', e.message);
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
