'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function mascararTelefone(v) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2)  return d.length ? `(${d}` : '';
  if (d.length <= 6)  return `(${d.slice(0,2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
}

export default function Contatos() {
  const [contatos,  setContatos]  = useState([]);
  const [nome,      setNome]      = useState('');
  const [telefone,  setTelefone]  = useState('');
  const [salvando,  setSalvando]  = useState(false);
  const [removendo, setRemovendo] = useState(null);
  const [erro,      setErro]      = useState('');
  const router = useRouter();

  const usuarioId = typeof window !== 'undefined' ? localStorage.getItem('usuario_id') : null;

  useEffect(() => {
    if (!usuarioId) { router.push('/'); return; }
    carregar();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  async function carregar() {
    const r = await fetch(`/api/contatos?usuario_id=${usuarioId}`);
    setContatos(await r.json());
  }

  async function adicionar() {
    setErro('');
    const n = nome.trim();
    const t = telefone.trim();
    if (!n)                    { setErro('Informe o nome.');     return; }
    if (t.replace(/\D/g,'').length < 10) { setErro('Telefone inválido (mínimo 10 dígitos com DDD).'); return; }
    setSalvando(true);
    try {
      const r = await fetch('/api/contatos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: usuarioId, nome: n, telefone: t }),
      });
      const novo = await r.json();
      setContatos(prev => [...prev, novo].sort((a,b) => a.nome.localeCompare(b.nome)));
      setNome('');
      setTelefone('');
    } catch {
      setErro('Erro ao salvar contato.');
    } finally {
      setSalvando(false);
    }
  }

  async function remover(id) {
    setRemovendo(id);
    try {
      await fetch(`/api/contatos?id=${id}&usuario_id=${usuarioId}`, { method: 'DELETE' });
      setContatos(prev => prev.filter(c => c.id !== id));
    } catch {
      setErro('Erro ao remover contato.');
    } finally {
      setRemovendo(null);
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111', color: '#ddd', fontFamily: 'system-ui, sans-serif' }}>

      {/* Cabeçalho */}
      <div style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #222', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={() => router.push('/configurar')}
          style={{ background: 'transparent', border: '1px solid #333', color: '#666', borderRadius: '8px', padding: '8px 14px', fontSize: '16px', cursor: 'pointer' }}
        >
          ← Voltar
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', color: '#eee', fontWeight: 600 }}>Contatos</h1>
          <p style={{ margin: '2px 0 0', fontSize: '14px', color: '#555' }}>Familiares e cuidadores</p>
        </div>
      </div>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '28px 16px 48px' }}>

        {/* Formulário de adição */}
        <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #222', borderRadius: '16px', padding: '20px', marginBottom: '28px' }}>
          <h2 style={{ margin: '0 0 18px', fontSize: '16px', color: '#888', fontWeight: 500, letterSpacing: '.04em' }}>
            ADICIONAR CONTATO
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              placeholder="Nome completo"
              value={nome}
              onChange={e => setNome(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && adicionar()}
              style={estiloInput}
            />
            <input
              type="tel"
              placeholder="(11) 99999-9999"
              value={telefone}
              onChange={e => setTelefone(mascararTelefone(e.target.value))}
              onKeyDown={e => e.key === 'Enter' && adicionar()}
              style={estiloInput}
            />
            {erro && <p style={{ margin: 0, fontSize: '14px', color: '#e74c3c' }}>{erro}</p>}
            <button
              onClick={adicionar}
              disabled={salvando}
              style={{
                fontSize: '18px', padding: '14px', backgroundColor: salvando ? '#1a3a5c' : '#0070f3',
                color: 'white', border: 'none', borderRadius: '10px', cursor: salvando ? 'default' : 'pointer',
                fontWeight: 600, transition: 'background-color .2s',
              }}
            >
              {salvando ? 'Salvando...' : '+ Adicionar'}
            </button>
          </div>
        </div>

        {/* Lista de contatos */}
        {contatos.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#444', fontSize: '16px', marginTop: '32px' }}>
            Nenhum contato cadastrado ainda.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {contatos.map(c => (
              <div key={c.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                backgroundColor: '#1a1a1a', border: '1px solid #222', borderRadius: '12px', padding: '14px 16px',
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#eee' }}>{c.nome}</p>
                  <p style={{ margin: '4px 0 0', fontSize: '16px', color: '#666', letterSpacing: '.04em' }}>{c.telefone}</p>
                </div>
                <button
                  onClick={() => remover(c.id)}
                  disabled={removendo === c.id}
                  style={{
                    background: 'transparent', border: '1px solid #333', color: '#555',
                    borderRadius: '8px', padding: '8px 12px', fontSize: '15px', cursor: 'pointer',
                  }}
                >
                  {removendo === c.id ? '...' : 'Remover'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const estiloInput = {
  fontSize: '18px',
  padding: '13px 14px',
  borderRadius: '10px',
  border: '1px solid #2a2a2a',
  backgroundColor: '#242424',
  color: 'white',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};
