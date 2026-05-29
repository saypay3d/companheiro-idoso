'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function Conversa() {
  const [estado, setEstado] = useState('iniciando');
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [semSupporte, setSemSupporte] = useState(false);
  const [modoCalib, setModoCalib] = useState(false);
  const [inputCalib, setInputCalib] = useState('');
  const router = useRouter();

  const pausarRef = useRef(false);
  const usuarioIdRef = useRef(null);
  const recRef = useRef(null);
  const enviarRef = useRef(null);

  useEffect(() => {
    const id = localStorage.getItem('usuario_id');
    if (!id) { router.push('/'); return; }
    usuarioIdRef.current = id;

    fetch('/api/usuarios')
      .then(r => r.json())
      .then(data => {
        const user = data.find(u => String(u.id) === String(id));
        if (user) setNomeUsuario(user.nome);
      });

    const falar = (texto) => new Promise((resolve) => {
      const synth = window.speechSynthesis;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(texto);
      u.lang = 'pt-BR';
      u.rate = 0.8;
      u.onend = resolve;
      u.onerror = resolve;
      synth.speak(u);
    });

    async function enviarParaIA(texto) {
      setEstado('pensando');
      try {
        const res = await fetch('/api/conversas', {
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
      }
    }

    function iniciarEscuta() {
      if (pausarRef.current) return;
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) { setSemSupporte(true); return; }

      const rec = new SR();
      rec.lang = 'pt-BR';
      rec.continuous = false;
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
        if (e.error !== 'no-speech' && e.error !== 'aborted') {
          console.error('Reconhecimento:', e.error);
        }
      };

      rec.onend = () => {
        if (!pausarRef.current) setTimeout(iniciarEscuta, 300);
      };

      recRef.current = rec;
      try { rec.start(); } catch (e) { console.error(e); }
    }

    enviarRef.current = enviarParaIA;

    const timer = setTimeout(iniciarEscuta, 800);

    return () => {
      clearTimeout(timer);
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

  const avatarEmoji = { iniciando: '😊', ouvindo: '👂', pensando: '💭', falando: '🗣️' }[estado] ?? '😊';
  const statusTexto = { iniciando: 'Iniciando...', ouvindo: 'Estou te ouvindo...', pensando: 'Pensando...', falando: 'Falando...' }[estado] ?? '';
  const bordaCor = { iniciando: '#555', ouvindo: '#2ecc71', pensando: '#0070f3', falando: '#f39c12' }[estado] ?? '#555';
  const fundoCor = { iniciando: '#222', ouvindo: '#0a2a0a', pensando: '#0a1a2a', falando: '#2a1800' }[estado] ?? '#222';
  const anClasse = { ouvindo: 'av-ouvindo', falando: 'av-falando' }[estado] ?? '';

  return (
    <>
      <style>{`
        @keyframes respirar {
          0%, 100% { box-shadow: 0 0 0 0 rgba(46,204,113,0.6), 0 0 0 0 rgba(46,204,113,0.3); }
          50%       { box-shadow: 0 0 0 30px rgba(46,204,113,0), 0 0 0 60px rgba(46,204,113,0); }
        }
        @keyframes pulsar-fala {
          0%, 100% { box-shadow: 0 0 0 0 rgba(243,156,18,0.6), 0 0 0 0 rgba(243,156,18,0.3); }
          50%       { box-shadow: 0 0 0 20px rgba(243,156,18,0), 0 0 0 40px rgba(243,156,18,0); }
        }
        .av-ouvindo { animation: respirar 2s ease-in-out infinite; }
        .av-falando { animation: pulsar-fala 0.7s ease-in-out infinite; }
      `}</style>

      <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a', overflow: 'hidden' }}>

        {/* Barra superior discreta */}
        <div style={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 20 }}>
          <button
            onClick={() => { pausarRef.current = true; try { recRef.current?.stop(); } catch (e) {} window.speechSynthesis?.cancel(); router.push('/'); }}
            style={{ fontSize: '18px', padding: '8px 14px', background: 'transparent', color: '#555', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer' }}
          >
            ← Sair
          </button>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setModoCalib(v => !v)}
              style={{ fontSize: '16px', padding: '8px 12px', background: 'transparent', color: '#444', border: '1px solid #2a2a2a', borderRadius: '8px', cursor: 'pointer' }}
            >
              Calibração
            </button>
            {modoCalib && (
              <div style={{ position: 'absolute', top: '44px', right: 0, backgroundColor: '#242424', border: '1px solid #333', borderRadius: '12px', padding: '16px', width: '300px', zIndex: 30 }}>
                <p style={{ fontSize: '16px', color: '#888', margin: '0 0 10px' }}>Modo texto (teste)</p>
                <input
                  type="text"
                  value={inputCalib}
                  onChange={e => setInputCalib(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && calibEnviar()}
                  placeholder="Digite uma mensagem..."
                  autoFocus
                  style={{ width: '100%', fontSize: '18px', padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#333', color: 'white', boxSizing: 'border-box', outline: 'none' }}
                />
                <button
                  onClick={calibEnviar}
                  style={{ marginTop: '10px', width: '100%', fontSize: '18px', padding: '10px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Enviar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Nome */}
        {nomeUsuario && (
          <p style={{ fontSize: '26px', color: '#666', margin: '0 0 28px', letterSpacing: '0.03em' }}>
            Olá, {nomeUsuario}!
          </p>
        )}

        {/* Avatar */}
        <div
          className={anClasse}
          style={{
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            backgroundColor: fundoCor,
            border: `8px solid ${bordaCor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '150px',
            lineHeight: 1,
            transition: 'border-color 0.6s ease, background-color 0.6s ease',
            userSelect: 'none',
          }}
        >
          {avatarEmoji}
        </div>

        {/* Status */}
        <p style={{
          fontSize: '28px',
          fontWeight: 300,
          margin: '36px 0 0',
          color: semSupporte ? '#e74c3c' : bordaCor,
          textAlign: 'center',
          transition: 'color 0.6s ease',
          letterSpacing: '0.04em',
        }}>
          {semSupporte ? '⚠️ Use o Google Chrome para ativar o microfone' : statusTexto}
        </p>

      </div>
    </>
  );
}
