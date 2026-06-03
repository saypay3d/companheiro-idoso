'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function CuidadorContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [dados,      setDados]      = useState(null);
  const [erro,       setErro]       = useState('');
  const [mensagem,   setMensagem]   = useState('');
  const [mensagens,  setMensagens]  = useState([]);
  const [enviando,   setEnviando]   = useState(false);
  const [obsStatus,  setObsStatus]  = useState('idle'); // idle | loading | done
  const [obsVideo,   setObsVideo]   = useState(null);
  const [obsHorario, setObsHorario] = useState(null);
  const pollingRef    = useRef(null);
  const intervaloMsgRef = useRef(null);

  useEffect(() => {
    if (!token) { setErro('Token inválido ou ausente.'); return; }

    fetch(`/api/cuidador?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setErro(data.error); return; }
        setDados(data);
        carregarMensagens(data.id);
      })
      .catch(() => setErro('Erro ao validar token.'));

    return () => {
      if (pollingRef.current)    clearInterval(pollingRef.current);
      if (intervaloMsgRef.current) clearInterval(intervaloMsgRef.current);
    };
  }, [token]);

  // Polling de mensagens — inicia quando dados carregam
  useEffect(() => {
    if (!dados) return;
    const poll = async () => {
      try {
        const res = await fetch(`/api/cuidador-mensagem?usuario_id=${dados.id}`);
        if (res.ok) setMensagens(await res.json());
      } catch (e) {
        console.warn('[cuidador msgs]', e.message);
      }
    };
    intervaloMsgRef.current = setInterval(poll, 10000);
    return () => clearInterval(intervaloMsgRef.current);
  }, [dados]);

  async function carregarMensagens(usuarioId) {
    try {
      const res = await fetch(`/api/cuidador-mensagem?usuario_id=${usuarioId}`);
      if (res.ok) setMensagens(await res.json());
    } catch (e) {
      console.warn('[cuidador] carregarMensagens erro:', e.message);
    }
  }

  async function enviarMensagem() {
    if (!mensagem.trim() || !dados) return;
    setEnviando(true);
    await fetch('/api/cuidador-mensagem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id: dados.id, de_nome: dados.cuidador_nome, mensagem: mensagem.trim() }),
    });
    setMensagem('');
    await carregarMensagens(dados.id);
    setEnviando(false);
  }

  async function verIdoso() {
    if (!dados) return;
    setObsStatus('loading');
    setObsVideo(null);
    if (pollingRef.current) clearInterval(pollingRef.current);

    const res  = await fetch('/api/observacao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id: dados.id }),
    });
    const obs = await res.json();

    pollingRef.current = setInterval(async () => {
      try {
        const r    = await fetch(`/api/observacao?id=${obs.id}`);
        const data = await r.json();
        if (data?.respondido && data.video) {
          clearInterval(pollingRef.current);
          setObsStatus('done');
          setObsVideo(data.video);
          setObsHorario(data.solicitado_em);
        }
      } catch (e) {
        console.warn('[cuidador obs]', e.message);
      }
    }, 5000);
  }

  if (erro) return (
    <div style={{ textAlign: 'center', marginTop: '80px', fontFamily: 'sans-serif', color: '#e74c3c', fontSize: '22px' }}>
      {erro}
    </div>
  );

  if (!dados) return (
    <div style={{ textAlign: 'center', marginTop: '80px', fontFamily: 'sans-serif', color: '#888', fontSize: '20px' }}>
      Carregando...
    </div>
  );

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '28px 20px 60px', fontFamily: 'sans-serif', backgroundColor: '#111', minHeight: '100vh', color: '#eee' }}>

      {/* Cabeçalho */}
      <h1 style={{ fontSize: '26px', margin: '0 0 6px' }}>Portal do Cuidador</h1>
      <p style={{ color: '#666', fontSize: '15px', margin: '0 0 32px' }}>
        Cuidador: <strong style={{ color: '#aaa' }}>{dados.cuidador_nome}</strong>
        &nbsp;·&nbsp;
        Idoso: <strong style={{ color: '#aaa' }}>{dados.nome}</strong>
      </p>

      {/* Ver Idoso */}
      <section style={{ marginBottom: '40px' }}>
        <button
          onClick={verIdoso}
          disabled={obsStatus === 'loading'}
          style={{
            width: '100%', padding: '22px', fontSize: '22px', fontWeight: 700,
            backgroundColor: obsStatus === 'loading' ? '#1a1a2a' : '#0070f3',
            color: 'white', border: 'none', borderRadius: '14px',
            cursor: obsStatus === 'loading' ? 'default' : 'pointer',
            transition: 'background .2s',
          }}
        >
          {obsStatus === 'loading' ? 'Aguardando câmera...' : 'Ver Idoso'}
        </button>

        {obsStatus === 'loading' && (
          <p style={{ textAlign: 'center', color: '#555', fontSize: '14px', marginTop: '10px' }}>
            A câmera será ativada no dispositivo do idoso em até 15 segundos.
          </p>
        )}

        {obsStatus === 'done' && obsVideo && (
          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: '13px', color: '#555', margin: '0 0 8px' }}>
              Capturado às {new Date(obsHorario).toLocaleTimeString('pt-BR')}
            </p>
            <video
              src={obsVideo}
              controls
              style={{ width: '100%', borderRadius: '10px', backgroundColor: '#000', display: 'block' }}
            />
            <button
              onClick={verIdoso}
              style={{ marginTop: '10px', padding: '8px 18px', fontSize: '15px', cursor: 'pointer', borderRadius: '8px', border: '1px solid #2a5a8c', backgroundColor: '#0d2137', color: '#7ab3ef' }}
            >
              Nova Gravação
            </button>
          </div>
        )}
      </section>

      {/* Enviar mensagem */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', margin: '0 0 12px' }}>Mensagem para {dados.nome}</h2>
        <textarea
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          placeholder="Digite sua mensagem..."
          rows={3}
          style={{
            width: '100%', fontSize: '17px', padding: '12px', borderRadius: '10px',
            border: '1px solid #333', backgroundColor: '#1a1a1a', color: '#eee',
            resize: 'vertical', boxSizing: 'border-box', outline: 'none',
          }}
        />
        <button
          onClick={enviarMensagem}
          disabled={enviando || !mensagem.trim()}
          style={{
            marginTop: '10px', width: '100%', padding: '14px', fontSize: '18px', fontWeight: 600,
            backgroundColor: enviando || !mensagem.trim() ? '#222' : '#0070f3',
            color: enviando || !mensagem.trim() ? '#555' : 'white',
            border: 'none', borderRadius: '10px',
            cursor: enviando || !mensagem.trim() ? 'default' : 'pointer',
          }}
        >
          {enviando ? 'Enviando...' : 'Enviar'}
        </button>
      </section>

      {/* Lista de mensagens */}
      <section>
        <h2 style={{ fontSize: '20px', margin: '0 0 4px' }}>Mensagens enviadas</h2>
        <p style={{ fontSize: '13px', color: '#444', margin: '0 0 16px' }}>Atualiza automaticamente a cada 10 segundos.</p>
        {mensagens.length === 0 && (
          <p style={{ color: '#444', fontSize: '16px' }}>Nenhuma mensagem enviada ainda.</p>
        )}
        {mensagens.map(m => (
          <div key={m.id} style={{ marginBottom: '16px', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${m.resposta ? '#1a5a2a' : '#222'}` }}>
            {/* Mensagem enviada pelo cuidador */}
            <div style={{ padding: '14px', backgroundColor: '#1a1a1a' }}>
              <p style={{ fontSize: '12px', color: '#444', margin: '0 0 6px' }}>
                {new Date(m.criado_em).toLocaleString('pt-BR')} — {m.de_nome}
              </p>
              <p style={{ fontSize: '16px', color: '#ccc', margin: 0 }}>{m.mensagem}</p>
            </div>

            {/* Resposta do idoso — destaque verde */}
            {m.resposta ? (
              <div style={{ padding: '14px', backgroundColor: '#0a2a12', borderTop: '1px solid #1a5a2a' }}>
                <p style={{ fontSize: '11px', color: '#2a7a3a', margin: '0 0 6px', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                  Resposta do idoso
                </p>
                <p style={{ fontSize: '17px', color: '#2ecc71', margin: 0, fontWeight: 500 }}>
                  {m.resposta}
                </p>
              </div>
            ) : (
              <div style={{ padding: '10px 14px', backgroundColor: '#141414', borderTop: '1px solid #1e1e1e' }}>
                <p style={{ fontSize: '13px', color: '#333', margin: 0, fontStyle: 'italic' }}>Aguardando resposta do idoso...</p>
              </div>
            )}
          </div>
        ))}
      </section>

    </div>
  );
}

export default function CuidadorPage() {
  return (
    <Suspense fallback={
      <div style={{ textAlign: 'center', marginTop: '80px', fontFamily: 'sans-serif', color: '#888', fontSize: '20px' }}>
        Carregando...
      </div>
    }>
      <CuidadorContent />
    </Suspense>
  );
}
