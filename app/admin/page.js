'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function Admin() {
  const [usuarios,    setUsuarios]    = useState([]);
  const [novoNome,    setNovoNome]    = useState('');
  const [novaSenha,   setNovaSenha]   = useState('');
  const [resetSenhas, setResetSenhas] = useState({});
  const [msg,         setMsg]         = useState('');
  const [obsState,      setObsState]      = useState({});
  const [cuidadorAberto, setCuidadorAberto] = useState({});
  const [cuidadorNome,   setCuidadorNome]   = useState({});
  const [cuidadorLink,   setCuidadorLink]   = useState({});
  const pollingRefs = useRef({});
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem('is_admin')) { router.push('/'); return; }
    carregarUsuarios();
    return () => {
      Object.values(pollingRefs.current).forEach(t => t && clearInterval(t));
    };
  }, [router]);

  async function carregarUsuarios() {
    const res = await fetch('/api/usuarios');
    setUsuarios(await res.json());
  }

  async function criarUsuario() {
    if (!novoNome || !novaSenha) { setMsg('Preencha nome e senha.'); return; }
    await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: novoNome, senha: novaSenha, idade: 91 }),
    });
    setNovoNome(''); setNovaSenha('');
    setMsg('Usuário criado com sucesso!');
    carregarUsuarios();
  }

  async function resetarSenha(id) {
    const nova = resetSenhas[id];
    if (!nova) { setMsg('Digite a nova senha antes de resetar.'); return; }
    await fetch('/api/usuarios', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, senha: nova }),
    });
    setMsg('Senha redefinida!');
    setResetSenhas(prev => ({ ...prev, [id]: '' }));
    carregarUsuarios();
  }

  async function gerarLinkCuidador(userId) {
    const nome = (cuidadorNome[userId] || '').trim();
    if (!nome) { setMsg('Digite o nome do cuidador.'); return; }
    const res  = await fetch('/api/cuidador', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id: userId, cuidador_nome: nome }),
    });
    const data = await res.json();
    const link = `https://companheiro-idoso.vercel.app/cuidador?token=${data.token}`;
    setCuidadorLink(prev => ({ ...prev, [userId]: link }));
    setCuidadorAberto(prev => ({ ...prev, [userId]: false }));
    carregarUsuarios();
  }

  async function verIdoso(userId) {
    if (pollingRefs.current[userId]) {
      clearInterval(pollingRefs.current[userId]);
      pollingRefs.current[userId] = null;
    }

    setObsState(prev => ({ ...prev, [userId]: { status: 'loading' } }));

    const res  = await fetch('/api/observacao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id: userId }),
    });
    const data = await res.json();
    const obsId        = data.id;
    const solicitado_em = data.solicitado_em;

    setObsState(prev => ({ ...prev, [userId]: { status: 'loading', obsId, solicitado_em } }));

    pollingRefs.current[userId] = setInterval(async () => {
      try {
        const r   = await fetch(`/api/observacao?id=${obsId}`);
        const obs = await r.json();
        if (obs?.respondido && obs.video) {
          clearInterval(pollingRefs.current[userId]);
          pollingRefs.current[userId] = null;
          setObsState(prev => ({
            ...prev,
            [userId]: { status: 'done', obsId, video: obs.video, solicitado_em: obs.solicitado_em },
          }));
        }
      } catch (e) {
        console.warn('[admin obs]', e.message);
      }
    }, 5000);
  }

  function sair() {
    localStorage.removeItem('is_admin');
    router.push('/');
  }

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', padding: '0 20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '32px' }}>Painel Admin</h1>
        <button onClick={sair} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', borderRadius: '6px' }}>
          Sair
        </button>
      </div>

      <h2 style={{ fontSize: '24px', marginTop: '30px' }}>Criar novo usuário</h2>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input
          type="text" placeholder="Nome" value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
          style={{ fontSize: '18px', padding: '10px', flex: 1, minWidth: '140px' }}
        />
        <input
          type="text" placeholder="Senha" value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          style={{ fontSize: '18px', padding: '10px', flex: 1, minWidth: '140px' }}
        />
        <button
          onClick={criarUsuario}
          style={{ padding: '10px 20px', fontSize: '18px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          Criar
        </button>
      </div>

      {msg && <p style={{ color: 'green', fontSize: '18px', marginTop: '10px' }}>{msg}</p>}

      <h2 style={{ fontSize: '24px', marginTop: '30px' }}>Usuários cadastrados ({usuarios.length})</h2>
      {usuarios.length === 0 && <p style={{ color: '#666' }}>Nenhum usuário cadastrado.</p>}
      {usuarios.map(u => {
        const obs = obsState[u.id];
        return (
          <div key={u.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', marginBottom: '12px' }}>

            {/* Cabeçalho do usuário */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
              <strong style={{ fontSize: '20px' }}>{u.nome}</strong>
              <span style={{ color: '#666', fontSize: '15px' }}>
                Senha: {u.tem_senha ? '••••••' : <em>não definida</em>}
              </span>
              <button
                onClick={() => verIdoso(u.id)}
                style={{ padding: '6px 14px', fontSize: '15px', backgroundColor: '#1a3a5c', color: '#7ab3ef', border: '1px solid #2a5a8c', borderRadius: '6px', cursor: 'pointer' }}
              >
                Ver Idoso
              </button>
            </div>

            {/* Botão Gerar Link Cuidador */}
            <button
              onClick={() => setCuidadorAberto(prev => ({ ...prev, [u.id]: !prev[u.id] }))}
              style={{ padding: '6px 14px', fontSize: '15px', backgroundColor: '#1a4a2a', color: '#4ecc71', border: '1px solid #2a7a3a', borderRadius: '6px', cursor: 'pointer' }}
            >
              Gerar Link Cuidador
            </button>

            {/* Formulário + link do cuidador */}
            {(cuidadorAberto[u.id] || (!u.cuidador_token && !cuidadorLink[u.id])) && cuidadorAberto[u.id] && (
              <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Nome do cuidador"
                  value={cuidadorNome[u.id] || ''}
                  onChange={(e) => setCuidadorNome(prev => ({ ...prev, [u.id]: e.target.value }))}
                  style={{ fontSize: '16px', padding: '8px', flex: 1, minWidth: '160px' }}
                />
                <button
                  onClick={() => gerarLinkCuidador(u.id)}
                  style={{ padding: '8px 16px', fontSize: '16px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Gerar
                </button>
              </div>
            )}

            {/* Link recém-gerado */}
            {cuidadorLink[u.id] && (
              <div style={{ marginTop: '8px', padding: '10px', backgroundColor: '#0d2137', borderRadius: '8px', border: '1px solid #1a4a6a' }}>
                <p style={{ fontSize: '13px', color: '#888', margin: '0 0 6px' }}>Link do cuidador (copie e envie):</p>
                <code style={{ fontSize: '13px', color: '#4a9eff', wordBreak: 'break-all', display: 'block' }}>{cuidadorLink[u.id]}</code>
              </div>
            )}

            {/* Link existente no banco */}
            {u.cuidador_token && !cuidadorLink[u.id] && (
              <div style={{ marginTop: '8px', padding: '10px', backgroundColor: '#0d2137', borderRadius: '8px', border: '1px solid #1a4a6a' }}>
                <p style={{ fontSize: '13px', color: '#888', margin: '0 0 6px' }}>Cuidador: <strong style={{ color: '#eee' }}>{u.cuidador_nome}</strong></p>
                <code style={{ fontSize: '13px', color: '#4a9eff', wordBreak: 'break-all', display: 'block' }}>
                  {`https://companheiro-idoso.vercel.app/cuidador?token=${u.cuidador_token}`}
                </code>
              </div>
            )}

            {/* Área de observação */}
            {obs?.status === 'loading' && (
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px', color: '#888', fontSize: '15px' }}>
                <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #555', borderTopColor: '#7ab3ef', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
                Aguardando vídeo...
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {obs?.status === 'done' && (
              <div style={{ marginTop: '12px' }}>
                <p style={{ fontSize: '13px', color: '#888', margin: '0 0 8px' }}>
                  Capturado às {new Date(obs.solicitado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
                <video
                  src={obs.video}
                  controls
                  style={{ width: '100%', maxWidth: '320px', borderRadius: '8px', display: 'block', backgroundColor: '#000' }}
                />
                <button
                  onClick={() => verIdoso(u.id)}
                  style={{ marginTop: '10px', padding: '7px 16px', fontSize: '14px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #2a5a8c', backgroundColor: '#0d2137', color: '#7ab3ef' }}
                >
                  Nova Gravação
                </button>
              </div>
            )}

            {/* Reset senha */}
            <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
              <input
                type="text" placeholder="Nova senha"
                value={resetSenhas[u.id] || ''}
                onChange={(e) => setResetSenhas(prev => ({ ...prev, [u.id]: e.target.value }))}
                style={{ fontSize: '16px', padding: '8px', flex: 1 }}
              />
              <button
                onClick={() => resetarSenha(u.id)}
                style={{ padding: '8px 16px', fontSize: '16px', cursor: 'pointer', borderRadius: '6px' }}
              >
                Resetar senha
              </button>
            </div>

          </div>
        );
      })}
    </div>
  );
}
