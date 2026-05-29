'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Avatar from '../components/Avatar';

const PUXAR_APOS_MS          = 5 * 60 * 1000;  // 5 minutos sem interação
const VIGIA_APOS_MS          = 30 * 60 * 1000; // 30 minutos sem interação (noite)
const MAX_PUXAR_SEM_RESPOSTA = 3;

export default function Conversa() {
  const [estado,      setEstado]      = useState('iniciando');
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [avatarTipo,  setAvatarTipo]  = useState('vovo');
  const [semSupporte, setSemSupporte] = useState(false);
  const [modoCalib,   setModoCalib]   = useState(false);
  const [inputCalib,  setInputCalib]  = useState('');
  const [noturno,     setNoturno]     = useState(() => {
    const h = new Date().getHours();
    return h >= 21 || h < 7;
  });
  const router = useRouter();

  // Wake Lock — mantém a tela sempre ligada
  useEffect(() => {
    let wakeLock = null;
    let fallbackVideo = null;

    function ativarFallbackVideo() {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const stream = canvas.captureStream(1);
        fallbackVideo = document.createElement('video');
        fallbackVideo.srcObject = stream;
        fallbackVideo.muted = true;
        fallbackVideo.loop = true;
        fallbackVideo.play().catch(() => {});
        console.log('[wakeLock] fallback de vídeo ativo');
      } catch (e) {
        console.warn('[wakeLock] fallback de vídeo falhou:', e);
      }
    }

    async function ativarWakeLock() {
      if (!navigator.wakeLock) { ativarFallbackVideo(); return; }
      try {
        wakeLock = await navigator.wakeLock.request('screen');
        console.log('[wakeLock] ativo');
        wakeLock.addEventListener('release', () => { wakeLock = null; });
      } catch (err) {
        console.warn('[wakeLock] falhou, usando fallback de vídeo:', err);
        ativarFallbackVideo();
      }
    }

    async function aoVoltarVisibilidade() {
      if (document.visibilityState === 'visible' && !wakeLock) {
        await ativarWakeLock();
      }
    }

    ativarWakeLock();
    document.addEventListener('visibilitychange', aoVoltarVisibilidade);

    return () => {
      document.removeEventListener('visibilitychange', aoVoltarVisibilidade);
      wakeLock?.release().catch(() => {});
      if (fallbackVideo) { fallbackVideo.pause(); fallbackVideo.srcObject = null; }
    };
  }, []);

  const pausarRef           = useRef(false);
  const usuarioIdRef        = useRef(null);
  const recRef              = useRef(null);
  const enviarRef           = useRef(null);
  const timerPuxarRef       = useRef(null);
  const modoVigiaRef        = useRef(false);
  const puxarSemRespostaRef = useRef(0);

  useEffect(() => {
    const id = localStorage.getItem('usuario_id');
    if (!id) { router.push('/'); return; }
    usuarioIdRef.current = id;
    setAvatarTipo(localStorage.getItem('avatar_tipo') || 'vovo');

    fetch('/api/usuarios')
      .then(r => r.json())
      .then(data => {
        const user = data.find(u => String(u.id) === String(id));
        if (user) setNomeUsuario(user.nome);
      });

    function isNoite() {
      const h = new Date().getHours();
      return h >= 21 || h < 7;
    }

    // Carrega vozes de forma assíncrona e guarda em ref
    const vozesRef = { current: window.speechSynthesis.getVoices() };

    function carregarVozes() {
      const todas = window.speechSynthesis.getVoices();
      vozesRef.current = todas;
      console.log('[vozes] total disponível:', todas.length);
      todas.forEach(v => console.log('[voz]', v.lang, '|', v.name));
    }

    carregarVozes();
    window.speechSynthesis.onvoiceschanged = carregarVozes;

    function selecionarVoz(u) {
      const vozTipo = localStorage.getItem('voz_tipo') || 'feminina';
      const todas = vozesRef.current;
      if (!todas.length) return;
      const pt = todas.filter(v => v.lang.startsWith('pt'));
      const pool = pt.length ? pt : todas;
      const voz = vozTipo === 'masculina'
        ? (pool.find(v => /male|paulo|daniel/i.test(v.name)) || pool[pool.length - 1])
        : (pool.find(v => /female|maria|francisca/i.test(v.name)) || pool[0]);
      console.log('[vozes] selecionada:', voz?.name, '| tipo:', vozTipo);
      if (voz) u.voice = voz;
    }

    const falar = (texto) => new Promise((resolve) => {
      const synth = window.speechSynthesis;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(texto);
      u.lang    = 'pt-BR';
      u.rate    = 0.8;
      selecionarVoz(u);
      u.onend   = resolve;
      u.onerror = resolve;
      synth.speak(u);
    });

    async function salvarAtividadeNoturna(tipo, descricao) {
      try {
        await fetch('/api/atividade-noturna', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario_id: usuarioIdRef.current, tipo, descricao }),
        });
      } catch (e) {
        console.error('[atividade_noturna] erro ao salvar:', e.message);
      }
    }

    function agendarProximaAcao() {
      clearTimeout(timerPuxarRef.current);
      if (isNoite()) {
        timerPuxarRef.current = setTimeout(entrarVigia, VIGIA_APOS_MS);
      } else {
        modoVigiaRef.current = false;
        timerPuxarRef.current = setTimeout(puxarConversa, PUXAR_APOS_MS);
      }
    }

    function entrarVigia() {
      if (pausarRef.current) {
        timerPuxarRef.current = setTimeout(entrarVigia, 60000);
        return;
      }
      if (!isNoite()) {
        agendarProximaAcao();
        return;
      }
      modoVigiaRef.current = true;
      setEstado('vigia');
      salvarAtividadeNoturna('silencio', 'Sem atividade por 30 minutos');
    }

    async function puxarConversa() {
      if (isNoite()) {
        agendarProximaAcao();
        return;
      }
      if (pausarRef.current) {
        timerPuxarRef.current = setTimeout(puxarConversa, 60000);
        return;
      }
      pausarRef.current = true;
      try { recRef.current?.stop(); } catch (e) {}
      setEstado('pensando');
      try {
        const res  = await fetch('/api/conversas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario_id: usuarioIdRef.current, puxar: true }),
        });
        const data = await res.json();
        if (data.resposta) {
          setEstado('falando');
          await falar(data.resposta);
        }
      } catch (e) {
        console.error('[puxar] erro no cliente:', e);
      } finally {
        pausarRef.current = false;
        puxarSemRespostaRef.current += 1;
        const preocupado = puxarSemRespostaRef.current >= MAX_PUXAR_SEM_RESPOSTA;
        setEstado(preocupado ? 'preocupado' : 'ouvindo');
        iniciarEscuta();
        agendarProximaAcao();
      }
    }

    async function processarEnvioMensagem(nomeContato, mensagem) {
      try {
        const r = await fetch(`/api/contatos?usuario_id=${usuarioIdRef.current}`);
        const contatos = await r.json();
        const contato = contatos.find(c =>
          c.nome.toLowerCase().includes(nomeContato.toLowerCase()) ||
          nomeContato.toLowerCase().includes(c.nome.toLowerCase().split(' ')[0])
        );
        if (!contato) {
          await falar(`Não encontrei ${nomeContato} na lista de contatos.`);
          return;
        }
        const fone = contato.telefone.replace(/\D/g, '');
        const url  = `https://wa.me/55${fone}?text=${encodeURIComponent(mensagem)}`;
        window.open(url, '_blank', 'noopener');
        console.log('[envio_msg] abrindo WhatsApp para', contato.nome, url);
        await falar(`Abrindo WhatsApp para enviar mensagem para ${contato.nome}!`);
      } catch (e) {
        console.error('[envio_msg]', e);
        await falar('Não consegui abrir o WhatsApp. Tente novamente.');
      }
    }

    async function enviarParaIA(texto, modoNoite = false) {
      clearTimeout(timerPuxarRef.current);
      puxarSemRespostaRef.current = 0;
      setEstado('pensando');
      try {
        const res  = await fetch('/api/conversas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            usuario_id: usuarioIdRef.current,
            mensagem_usuario: texto,
            modo_noite: modoNoite,
          }),
        });
        const data = await res.json();
        setEstado('falando');

        // Detecta comando de envio de mensagem WhatsApp
        const matchEnviar = data.resposta?.match(/ENVIAR_MSG:([^:\n]+):([\s\S]+)/);
        if (matchEnviar) {
          await processarEnvioMensagem(matchEnviar[1].trim(), matchEnviar[2].trim());
        } else {
          await falar(data.resposta);
        }
      } catch (e) {
        console.error(e);
      } finally {
        pausarRef.current = false;
        setEstado('ouvindo');
        iniciarEscuta();
        agendarProximaAcao();
      }
    }

    function iniciarEscuta() {
      if (pausarRef.current) return;
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) { setSemSupporte(true); return; }

      const rec = new SR();
      rec.lang           = 'pt-BR';
      rec.continuous     = false;
      rec.interimResults = false;

      // Rastreia se som foi detectado nesta sessão (para distinguir barulho de silêncio)
      let detectouSom = false;

      rec.onstart = () => {
        if (!modoVigiaRef.current && puxarSemRespostaRef.current < MAX_PUXAR_SEM_RESPOSTA) {
          setEstado('ouvindo');
        }
      };

      rec.onspeechstart = () => {
        if (isNoite()) detectouSom = true;
      };

      rec.onresult = (e) => {
        const r = e.results[e.results.length - 1];
        if (r.isFinal) {
          const texto = r[0].transcript.trim();
          if (texto) {
            detectouSom = false; // converteu em conversa, não barulho
            pausarRef.current = true;
            rec.stop();
            modoVigiaRef.current = false;
            if (isNoite()) salvarAtividadeNoturna('conversa', texto.slice(0, 300));
            enviarParaIA(texto, isNoite());
          }
        }
      };

      rec.onerror = (e) => {
        if (e.error !== 'no-speech' && e.error !== 'aborted') console.error('Reconhecimento:', e.error);
      };

      rec.onend = () => {
        if (detectouSom) {
          salvarAtividadeNoturna('barulho', 'Som detectado sem palavras reconhecidas');
          detectouSom = false;
        }
        if (!pausarRef.current) setTimeout(iniciarEscuta, 300);
      };

      recRef.current = rec;
      try { rec.start(); } catch (e) { console.error(e); }
    }

    enviarRef.current = enviarParaIA;

    const timerInicio = setTimeout(iniciarEscuta, 800);
    agendarProximaAcao();

    return () => {
      clearTimeout(timerInicio);
      clearTimeout(timerPuxarRef.current);
      pausarRef.current = true;
      try { recRef.current?.stop(); } catch (e) {}
      window.speechSynthesis?.cancel();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Overlay noturno — verifica a hora a cada minuto
  useEffect(() => {
    function verificar() {
      const h = new Date().getHours();
      setNoturno(h >= 21 || h < 7);
    }
    const intervalo = setInterval(verificar, 60000);
    return () => clearInterval(intervalo);
  }, []);

  const calibEnviar = () => {
    const texto = inputCalib.trim();
    if (!texto || !enviarRef.current) return;
    pausarRef.current = true;
    try { recRef.current?.stop(); } catch (e) {}
    setInputCalib('');
    enviarRef.current(texto);
  };

  const statusTexto = {
    iniciando:  'Iniciando...',
    ouvindo:    'Estou te ouvindo...',
    pensando:   'Pensando...',
    falando:    'Falando...',
    vigia:      'Estou de vigia...',
    preocupado: 'Estou preocupada com você...',
  }[estado] ?? 'Estou aqui...';

  const statusCor = {
    ouvindo:    '#2ecc71',
    pensando:   '#9b59b6',
    falando:    '#3498db',
    iniciando:  '#555',
    vigia:      '#4a7f9f',
    preocupado: '#e67e22',
  }[estado] ?? '#555';

  return (
    <div style={{ position:'fixed', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', backgroundColor:'#1a1a1a', overflow:'hidden' }}>

      {/* Barra superior */}
      <div style={{ position:'absolute', top:16, left:16, right:16, display:'flex', justifyContent:'space-between', alignItems:'flex-start', zIndex:20 }}>
        <button
          onClick={() => { pausarRef.current=true; try{recRef.current?.stop();}catch(e){} window.speechSynthesis?.cancel(); router.push('/configurar'); }}
          style={{ fontSize:'18px', padding:'8px 14px', background:'transparent', color:'#555', border:'1px solid #333', borderRadius:'8px', cursor:'pointer' }}
        >
          ← Voltar
        </button>
        <div style={{ position:'relative' }}>
          <button
            onClick={() => setModoCalib(v => !v)}
            style={{ fontSize:'16px', padding:'8px 12px', background:'transparent', color:'#444', border:'1px solid #2a2a2a', borderRadius:'8px', cursor:'pointer' }}
          >
            Calibração
          </button>
          {modoCalib && (
            <div style={{ position:'absolute', top:44, right:0, backgroundColor:'#242424', border:'1px solid #333', borderRadius:'12px', padding:'16px', width:'300px', zIndex:30 }}>
              <p style={{ fontSize:'16px', color:'#888', margin:'0 0 10px' }}>Modo texto (teste)</p>
              <input
                type="text"
                value={inputCalib}
                onChange={e => setInputCalib(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && calibEnviar()}
                placeholder="Digite uma mensagem..."
                autoFocus
                style={{ width:'100%', fontSize:'18px', padding:'10px', borderRadius:'8px', border:'none', backgroundColor:'#333', color:'white', boxSizing:'border-box', outline:'none' }}
              />
              <button
                onClick={calibEnviar}
                style={{ marginTop:'10px', width:'100%', fontSize:'18px', padding:'10px', backgroundColor:'#0070f3', color:'white', border:'none', borderRadius:'8px', cursor:'pointer' }}
              >
                Enviar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Nome */}
      {nomeUsuario && (
        <p style={{ fontSize:'26px', color:'#666', margin:'0 0 24px', letterSpacing:'.03em' }}>
          Olá, {nomeUsuario}!
        </p>
      )}

      {/* Avatar */}
      <div style={{ width:'clamp(260px, 55vh, 420px)', height:'clamp(260px, 55vh, 420px)' }}>
        <Avatar estado={estado} tipo={avatarTipo} />
      </div>

      {/* Status */}
      <p style={{ fontSize:'28px', fontWeight:300, margin:'28px 0 0', color: semSupporte ? '#e74c3c' : statusCor, textAlign:'center', transition:'color .5s ease', letterSpacing:'.04em', padding:'0 24px' }}>
        {semSupporte ? '⚠️ Use o Google Chrome para ativar o microfone' : statusTexto}
      </p>

      {/* Overlay noturno */}
      {noturno && (
        <div style={{ position:'fixed', inset:0, backgroundColor:'black', opacity:0.6, pointerEvents:'none', zIndex:50, transition:'opacity 1s ease' }} />
      )}

    </div>
  );
}
