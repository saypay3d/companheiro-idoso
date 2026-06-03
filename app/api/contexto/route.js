function fetchComTimeout(url, ms = 3000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timeout));
}

export async function GET() {
  const [climaResult, noticiasResult, historiaResult] = await Promise.allSettled([
    fetchComTimeout('https://wttr.in/Ijui?format=j1'),
    fetchComTimeout('https://news.google.com/rss/search?q=Rio+Grande+do+Sul&hl=pt-BR&gl=BR'),
    fetchComTimeout('https://byabbe.se/on-this-day/today/events.json'),
  ]);

  // Clima
  let clima = null;
  if (climaResult.status === 'fulfilled' && climaResult.value.ok) {
    try {
      const data = await climaResult.value.json();
      const c = data.current_condition?.[0];
      clima = {
        temp_c:   c?.temp_C,
        descricao: c?.weatherDesc?.[0]?.value,
        umidade:  c?.humidity,
        sensacao: c?.FeelsLikeC,
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
        ano:      e.year,
        descricao: e.description,
      }));
    } catch (e) {
      console.warn('[contexto] historia parse error:', e.message);
    }
  } else {
    console.warn('[contexto] historia falhou:', historiaResult.reason?.message ?? historiaResult.status);
  }

  console.log('[contexto] clima:', !!clima, '| noticias:', noticias.length, '| historia:', historia.length);

  return Response.json({ clima, noticias, historia });
}
