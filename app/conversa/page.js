'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function Conversa() {
  const [mensagens, setMensagens] = useState([]);
  const [input, setInput] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [usuarioId, setUsuarioId] = useState(null);
  const fimRef = useRef(null);
  const router = useRouter();

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
  }, [router]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const enviar = async () => {
    if (!input.trim() || carregando) return;
    const texto = input.trim();
    setInput('');
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

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '36px', margin: 0 }}>Seu Companheiro</h1>
        <button
          onClick={() => router.push('/')}
          style={{ fontSize: '20px', padding: '10px 20px', backgroundColor: '#444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          ← Voltar
        </button>
      </div>

      <div style={{
        backgroundColor: '#2a2a2a',
        borderRadius: '12px',
        padding: '20px',
        minHeight: '400px',
        maxHeight: '62vh',
        overflowY: 'auto',
        marginBottom: '20px',
      }}>
        {mensagens.length === 0 && !carregando && (
          <p style={{ color: '#888', textAlign: 'center', fontSize: '22px', marginTop: '60px' }}>
            Olá! Diga alguma coisa para começarmos a conversar.
          </p>
        )}

        {mensagens.map((msg, i) => (
          <div key={i} style={{ marginBottom: '16px', textAlign: msg.de === 'usuario' ? 'right' : 'left' }}>
            <span style={{
              display: 'inline-block',
              backgroundColor: msg.de === 'usuario' ? '#0070f3' : '#444',
              padding: '14px 20px',
              borderRadius: '14px',
              maxWidth: '78%',
              fontSize: '22px',
              lineHeight: '1.5',
              textAlign: 'left',
            }}>
              {msg.texto}
            </span>
          </div>
        ))}

        {carregando && (
          <div style={{ textAlign: 'left', marginBottom: '16px' }}>
            <span style={{ backgroundColor: '#444', padding: '14px 20px', borderRadius: '14px', fontSize: '22px' }}>
              ✦ ✦ ✦
            </span>
          </div>
        )}
        <div ref={fimRef} />
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && enviar()}
          placeholder="Digite aqui..."
          disabled={carregando}
          style={{
            flex: 1,
            fontSize: '22px',
            padding: '16px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: '#2a2a2a',
            color: 'white',
            outline: 'none',
          }}
        />
        <button
          onClick={enviar}
          disabled={carregando || !input.trim()}
          style={{
            fontSize: '22px',
            padding: '16px 32px',
            backgroundColor: carregando ? '#555' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: carregando ? 'default' : 'pointer',
          }}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
