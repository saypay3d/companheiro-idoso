function fetchComTimeout(url, ms = 3000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timeout));
}

function calcularFaseLua() {
  const CICLO = 29.53059;
  // Julian date: referencia lua nova em 6 Jan 2000 18:14 UTC = JD 2451550.1
  const jd = Date.now() / 86400000 + 2440587.5;
  const idade = ((jd - 2451550.1) % CICLO + CICLO) % CICLO;

  let nome;
  if      (idade <  1.85) nome = 'Lua Nova';
  else if (idade <  7.38) nome = 'Lua Crescente';
  else if (idade <  9.22) nome = 'Quarto Crescente';
  else if (idade < 14.77) nome = 'Lua Crescente Gibosa';
  else if (idade < 16.61) nome = 'Lua Cheia';
  else if (idade < 22.15) nome = 'Lua Minguante Gibosa';
  else if (idade < 23.99) nome = 'Quarto Minguante';
  else                    nome = 'Lua Minguante';

  return { nome, idade_dias: Math.round(idade * 10) / 10 };
}

export async function GET() {
  const [climaResult, noticiasResult, historiaResult, fraseResult, dolarResult] = await Promise.allSettled([
    fetchComTimeout('https://wttr.in/Ijui?format=j1'),
    fetchComTimeout('https://news.google.com/rss/search?q=Rio+Grande+do+Sul&hl=pt-BR&gl=BR'),
    fetchComTimeout('https://byabbe.se/on-this-day/today/events.json'),
    fetchComTimeout('https://api.quotable.io/random'),
    fetchComTimeout('https://economia.awesomeapi.com.br/last/USD-BRL'),
  ]);

  // Clima
  let clima = null;
  if (climaResult.status === 'fulfilled' && climaResult.value.ok) {
    try {
      const data = await climaResult.value.json();
      const c = data.current_condition?.[0];
      clima = {
        temp_c:    c?.temp_C,
        descricao: c?.weatherDesc?.[0]?.value,
        umidade:   c?.humidity,
        sensacao:  c?.FeelsLikeC,
      };
    } catch (e) {
      console.warn('[contexto] clima parse error:', e.message);
    }
  } else {
    console.warn('[contexto] clima falhou:', climaResult.reason?.message ?? climaResult.status);
  }

  // Noticias
  let noticias = [];
  if (noticiasResult.status === 'fulfilled' && noticiasResult.value.ok) {
    try {
      const xml = await noticiasResult.value.text();
      const matches = [...xml.matchAll(/<item>[\s\S]*?<title>([\s\S]*?)<\/title>/g)];
      noticias = matches.slice(0, 3).map(m =>
        m[1].replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '').trim()
      );
    } catch (e) {
      console.warn('[contexto] noticias parse error:', e.message);
    }
  } else {
    console.warn('[contexto] noticias falhou:', noticiasResult.reason?.message ?? noticiasResult.status);
  }

  // Hoje na historia
  let historia = [];
  if (historiaResult.status === 'fulfilled' && historiaResult.value.ok) {
    try {
      const data = await historiaResult.value.json();
      historia = (data.events ?? []).slice(0, 2).map(e => ({
        ano:       e.year,
        descricao: e.description,
      }));
    } catch (e) {
      console.warn('[contexto] historia parse error:', e.message);
    }
  } else {
    console.warn('[contexto] historia falhou:', historiaResult.reason?.message ?? historiaResult.status);
  }

  // Frase inspiracional
  let frase = null;
  if (fraseResult.status === 'fulfilled' && fraseResult.value.ok) {
    try {
      const data = await fraseResult.value.json();
      frase = { texto: data.content, autor: data.author };
    } catch (e) {
      console.warn('[contexto] frase parse error:', e.message);
    }
  } else {
    console.warn('[contexto] frase falhou:', fraseResult.reason?.message ?? fraseResult.status);
  }

  // Cotacao do dolar
  let dolar = null;
  if (dolarResult.status === 'fulfilled' && dolarResult.value.ok) {
    try {
      const data = await dolarResult.value.json();
      const usd = data.USDBRL;
      dolar = { compra: usd?.bid, venda: usd?.ask, variacao: usd?.pctChange };
    } catch (e) {
      console.warn('[contexto] dolar parse error:', e.message);
    }
  } else {
    console.warn('[contexto] dolar falhou:', dolarResult.reason?.message ?? dolarResult.status);
  }

  // Fase da lua (calculo local, sem API)
  const lua = calcularFaseLua();

  console.log('[contexto] clima:', !!clima, '| noticias:', noticias.length,
    '| historia:', historia.length, '| frase:', !!frase, '| dolar:', !!dolar, '| lua:', lua.nome);

  return Response.json({ clima, noticias, historia, frase, dolar, lua });
}
