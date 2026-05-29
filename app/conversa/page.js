'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function Conversa() {
  const [mensagens, setMensagens] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [usuarioId, setUsuarioId] = useState(null);
  const [gravando, setGravando] = useState(false);
  const [nomeUsuario, setNomeUsuario] = useState('');
  const fimRef = useRef(null);
  const router = useRouter();
  const reconhecimentoRef = useRef(null);

  useEffect(() => {
    const id = localStorage.getItem('usuario_id');
    if (!id) { router.push('/'); return; }
    setUsuarioId(id);

    fetch(`/api/conversas?usuario_id=${id}`)
      .then(r => r.json())
      .then(data => {
        const msgs = data.flatMap(c => [
          { de: 'usuario', texto: c.mensagem_usuario },
          { de: 'ia', texto: c.mensagem_ia },
        ]);
        setMensagens(msgs);
      });

    fetch(`/api/usuarios`)
      .then(r => r.json())
      .then(data => {
        const user = data.find(u => String(u.id) === String(id));
        if (user) setNomeUsuario(user.nome);
      });
  }, [router]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const enviarVoz = async (texto) => {
    if (!texto || carregando) return;
    setMensagens(prev => [...prev, { de: 'usuario', texto }]);
    setCarregando(true);
    try {
      const res = await fetch('/api/conversas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: usuarioId, mensagem_usuario: texto }),
      });
      const data = await res.json();
      setMensagens(prev => [...prev, { de: 'ia', texto: data.resposta }]);
    } finally {
      setCarregando(false);
    }
  };

  const toggleMicrofone = () => {
    if (gravando) {
      reconhecimentoRef.current?.stop();
      setGravando(false);
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert('Use o Google Chrome para ter reconhecimento de voz.');
      return;
    }

    const rec = new SR();
    rec.lang = 'pt-BR';
    rec.continuous = false;
    rec.interimResults = false;

    rec.onstart = () => setGravando(true);

    rec.onresult = (e) => {
      const resultado = e.results[e.results.length - 1];
      if (resultado.isFinal) {
        const texto = resultado[0].transcript.trim();
        if (texto) enviarVoz(texto);
      }
    };

    rec.onerror = (e) => {
      console.error('Erro microfone:', e.error);
      setGravando(false);
    };

    rec.onend = () => setGravando(false);

    reconhecimentoRef.current = rec;
    rec.start();
  };

  return (
    <>
      <style>{`
        @keyframes pulsar {
          0%   { box-shadow: 0 0 0 0 rgba(204, 0, 0, 0.7); }
          70%  { box-shadow: 0 0 0 30px rgba(204, 0, 0, 0); }
          100% { box-shadow: 0 0 0 0 rgba(204, 0, 0, 0); }
        }
        .mic-pulsando {
          animation: pulsar 1.2s infinite;
        }
      `}</style>

      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100vh', padding: '0 16px', boxSizing: 'border-box' }}>

        {/* Cabeçalho */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0 8px' }}>
          <h1 style={{ fontSize: '30px', margin: 0 }}>Seu Companheiro</h1>
          <button
            onClick={() => router.push('/')}
            style={{ fontSize: '22px', padding: '10px 20px', backgroundColor: '#444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            ← Voltar
          </button>
        </div>

        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0 12px' }}>
          <div style={{
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            backgroundColor: carregando ? '#555' : gravando ? '#3a0000' : '#1a3a5c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '100px',
            border: `5px solid ${gravando ? '#cc0000' : carregando ? '#888' : '#0070f3'}`,
            transition: 'border-color 0.4s, background-color 0.4s',
            userSelect: 'none',
          }}>
            {carregando ? '💭' : gravando ? '👂' : '🤗'}
          </div>
          {nomeUsuario && (
            <p style={{ fontSize: '24px', margin: '10px 0 0', color: '#aaa' }}>
              Olá, {nomeUsuario}!
            </p>
          )}
        </div>

        {/* Mensagens */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: '#2a2a2a',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '16px',
        }}>
          {mensagens.length === 0 && !carregando && (
            <p style={{ color: '#888', textAlign: 'center', fontSize: '24px', marginTop: '40px' }}>
              Aperte o microfone e fale comigo! 😊
            </p>
          )}

          {mensagens.map((msg, i) => (
            <div key={i} style={{ marginBottom: '16px', textAlign: msg.de === 'usuario' ? 'right' : 'left' }}>
              <span style={{
                display: 'inline-block',
                backgroundColor: msg.de === 'usuario' ? '#0070f3' : '#3a3a3a',
                padding: '14px 20px',
                borderRadius: '18px',
                maxWidth: '82%',
                fontSize: '24px',
                lineHeight: '1.6',
                textAlign: 'left',
              }}>
                {msg.texto}
              </span>
            </div>
          ))}

          {carregando && (
            <div style={{ textAlign: 'left', marginBottom: '16px' }}>
              <span style={{ backgroundColor: '#3a3a3a', padding: '14px 20px', borderRadius: '18px', fontSize: '24px' }}>
                ✦ ✦ ✦
              </span>
            </div>
          )}

          <div ref={fimRef} />
        </div>

        {/* Botão de microfone */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: '32px', gap: '14px' }}>
          <button
            onClick={toggleMicrofone}
            disabled={carregando}
            className={gravando ? 'mic-pulsando' : ''}
            style={{
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              backgroundColor: gravando ? '#cc0000' : carregando ? '#555' : '#1a7a1a',
              border: 'none',
              cursor: carregando ? 'default' : 'pointer',
              fontSize: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.3s',
              userSelect: 'none',
            }}
          >
            {gravando ? '⏹' : '🎤'}
          </button>

          <p style={{ fontSize: '24px', margin: 0, color: gravando ? '#ff6666' : carregando ? '#aaa' : '#888', textAlign: 'center' }}>
            {gravando ? '🔴 Ouvindo... fale agora!' : carregando ? 'Pensando...' : 'Toque para falar'}
          </p>
        </div>

      </div>
    </>
  );
}
