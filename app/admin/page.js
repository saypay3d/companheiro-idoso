'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Admin() {
  const [usuarios, setUsuarios] = useState([]);
  const [novoNome, setNovoNome] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [resetSenhas, setResetSenhas] = useState({});
  const [msg, setMsg] = useState('');
  const [obsMsg, setObsMsg] = useState({});
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem('is_admin')) { router.push('/'); return; }
    carregarUsuarios();
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
    setNovoNome('');
    setNovaSenha('');
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

  async function verIdoso(id) {
    setObsMsg(prev => ({ ...prev, [id]: 'Solicitando...' }));
    const res = await fetch('/api/observacao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id: id }),
    });
    const data = await res.json();
    setObsMsg(prev => ({ ...prev, [id]: `Solicitado às ${new Date(data.solicitado_em).toLocaleTimeString('pt-BR')}` }));
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
          type="text" placeholder="Nome"
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
          style={{ fontSize: '18px', padding: '10px', flex: 1, minWidth: '140px' }}
        />
        <input
          type="text" placeholder="Senha"
          value={novaSenha}
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
      {usuarios.map(u => (
        <div key={u.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', marginBottom: '12px' }}>
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
            {obsMsg[u.id] && (
              <span style={{ fontSize: '13px', color: '#4a9eff' }}>{obsMsg[u.id]}</span>
            )}
          </div>
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
      ))}
    </div>
  );
}
