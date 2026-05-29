'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Avatar from '../components/Avatar';

const DORMIR_APOS_MS = 45000;

export default function Conversa() {
  const [estado,      setEstado]      = useState('iniciando');
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [avatarTipo,  setAvatarTipo]  = useState('vovo');
  const [semSupporte, setSemSupporte] = useState(false);
  const [modoCalib,   setModoCalib]   = useState(false);
  const [inputCalib,  setInputCalib]  = useState('');
  const router = useRouter();

  const pausarRef      = useRef(false);
  const usuarioIdRef   = useRef(null);
  const recRef         = useRef(null);
  const enviarRef      = useRef(null);
  const timerDormirRef = useRef(null);

  function agendarSono() {
    clearTimeout(timerDormirRef.current);
    timerDormirRef.current = setTimeout(() => setEstado('dormindo'), DORMIR_APOS_MS);
  }

  useEffect(() => {
    const id = localStorage.getItem('usuario_id');
    if (!id) { router.push('/'); return; }
    usuarioIdRef.current = id;

    const tipo = localStorage.getItem('avatar_tipo') || 'vovo';
    setAvatarTipo(tipo);

    fetch('/api/usuarios')
      .then(r => r.json())
      .then(data => {
        const user = data.find(u => String(u.id) === String(id));
        if (user) setNomeUsuario(user.nome);
      });

    function selecionarVoz(u) {
      const vozTipo = localStorage.getItem('voz_tipo') || 'feminina';
      const vozes = window.speechSynthesis.getVoices();
      if (!vozes.length) return;
      const pt = vozes.filter(v => v.lang.startsWith('pt'));
      if (!pt.length) return;
      const voz = vozTipo === 'masculina'
        ? (pt.find(v => /ricardo|carlos|male|masc/i.test(v.name)) || pt[pt.length - 1])
        : (pt.find(v => /luciana|maria|female|fem/i.test(v.name))  || pt[0]);
      if (voz) u.voice = voz;
    }

    const falar = (texto) => new Promise((resolve) => {
      const synth = window.speechSynthesis;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(texto);
      u.lang = 'pt-BR';
      u.rate = 0.8;
      selecionarVoz(u);
      u.onend  = resolve;
      u.onerror = resolve;
      synth.speak(u);
    });

    async function enviarParaIA(texto) {
      clearTimeout(timerDormirRef.current);
      setEstado('pensando');
      try {
        const res  = await fetch('/api/conversas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario_id: usuarioIdRef.current, mensagem_usuario: texto }),
        });
        const data = await res.json();
        setEstado('falando');
        await falar(data.resposta);
      } catch (e) {
        console.error(e);
      } finally {
        pausarRef.current = false;
        setEstado('ouvindo');
        iniciarEscuta();
        agendarSono();
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

      rec.onstart = () => setEstado('ouvindo');

      rec.onresult = (e) => {
        const r = e.results[e.results.length - 1];
        if (r.isFinal) {
          const texto = r[0].transcript.trim();
          if (texto) {
            pausarRef.current = true;
            rec.stop();
            enviarParaIA(texto);
          }
        }
      };

      rec.onerror = (e) => {
        if (e.error !== 'no-speech' && e.error !== 'aborted') console.error('Reconhecimento:', e.error);
      };

      rec.onend = () => {
        if (!pausarRef.current) setTimeout(iniciarEscuta, 300);
      };

      recRef.current = rec;
      try { rec.start(); } catch (e) { console.error(e); }
    }

    enviarRef.current = enviarParaIA;

    const timerInicio = setTimeout(iniciarEscuta, 800);
    agendarSono();

    return () => {
      clearTimeout(timerInicio);
      clearTimeout(timerDormirRef.current);
      pausarRef.current = true;
      try { recRef.current?.stop(); } catch (e) {}
      window.speechSynthesis?.cancel();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const calibEnviar = () => {
    const texto = inputCalib.trim();
    if (!texto || !enviarRef.current) return;
    pausarRef.current = true;
    try { recRef.current?.stop(); } catch (e) {}
    setInputCalib('');
    enviarRef.current(texto);
  };

  const statusTexto = {
    iniciando: 'Iniciando...',
    ouvindo:   'Estou te ouvindo...',
    pensando:  'Pensando...',
    falando:   'Falando...',
    dormindo:  'Dormindo... fale para acordar 😴',
  }[estado] ?? '';

  const statusCor = {
    ouvindo:   '#2ecc71',
    pensando:  '#9b59b6',
    falando:   '#3498db',
    dormindo:  '#7f8c8d',
    iniciando: '#555',
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

    </div>
  );
}
