'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const CONDICOES_FISICAS = [
  'Caminha sozinho',
  'Caminha com ajuda',
  'Cadeirante',
  'Acamado',
];

const campo = (label, children) => (
  <div style={{ marginBottom: '28px' }}>
    <label style={{ display: 'block', fontSize: '17px', color: '#888', marginBottom: '8px', fontWeight: 500, letterSpacing: '.03em' }}>
      {label}
    </label>
    {children}
  </div>
);

const estiloInput = {
  width: '100%', fontSize: '20px', padding: '14px 16px',
  backgroundColor: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: '12px',
  color: '#eee', outline: 'none', boxSizing: 'border-box',
};

const estiloTextarea = {
  ...estiloInput,
  minHeight: '100px', resize: 'vertical', lineHeight: 1.5,
};

export default function Perfil() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome_completo: '', idade: '', apelido: '', condicao_fisica: 'Caminha sozinho',
    doencas: '', medicamentos: '', limitacoes_fisicas: '', limitacoes_cognitivas: '', rotina_diaria: '',
  });
  const [salvando,  setSalvando]  = useState(false);
  const [salvo,     setSalvo]     = useState(false);
  const [usuarioId, setUsuarioId] = useState(null);

  useEffect(() => {
    const id = localStorage.getItem('usuario_id');
    if (!id) { router.push('/'); return; }
    setUsuarioId(id);
    fetch(`/api/perfil?usuario_id=${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.usuario_id) {
          setForm({
            nome_completo:         data.nome_completo         ?? '',
            idade:                 data.idade                 ?? '',
            apelido:               data.apelido               ?? '',
            condicao_fisica:       data.condicao_fisica        ?? 'Caminha sozinho',
            doencas:               data.doencas               ?? '',
            medicamentos:          data.medicamentos           ?? '',
            limitacoes_fisicas:    data.limitacoes_fisicas     ?? '',
            limitacoes_cognitivas: data.limitacoes_cognitivas  ?? '',
            rotina_diaria:         data.rotina_diaria          ?? '',
          });
        }
      })
      .catch(() => {});
  }, [router]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function salvar() {
    setSalvando(true);
    setSalvo(false);
    try {
      await fetch('/api/perfil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: usuarioId, ...form }),
      });
      setSalvo(true);
      setTimeout(() => setSalvo(false), 3000);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111', color: '#ddd', fontFamily: 'system-ui, sans-serif' }}>

      {/* Cabeçalho */}
      <div style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #222', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, zIndex: 10 }}>
        <button
          onClick={() => router.push('/configurar')}
          style={{ background: 'transparent', border: '1px solid #333', color: '#666', borderRadius: '8px', padding: '8px 14px', fontSize: '16px', cursor: 'pointer' }}
        >
          ← Voltar
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '22px', color: '#eee', fontWeight: 600 }}>Perfil do Idoso</h1>
          <p style={{ margin: '2px 0 0', fontSize: '14px', color: '#555' }}>Preenchido pelo cuidador</p>
        </div>
        <button
          onClick={salvar}
          disabled={salvando}
          style={{
            fontSize: '17px', padding: '10px 24px', backgroundColor: salvando ? '#1a3a5c' : salvo ? '#1a4a2a' : '#0070f3',
            color: salvo ? '#2ecc71' : 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, transition: 'all .2s',
          }}
        >
          {salvando ? 'Salvando...' : salvo ? '✓ Salvo' : 'Salvar'}
        </button>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 20px 64px' }}>

        {/* Identificação */}
        <h2 style={{ fontSize: '16px', color: '#555', letterSpacing: '.06em', margin: '0 0 20px', fontWeight: 500 }}>IDENTIFICAÇÃO</h2>

        {campo('Nome completo',
          <input type="text" value={form.nome_completo} onChange={e => set('nome_completo', e.target.value)}
            placeholder="Nome completo do idoso" style={estiloInput} />
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {campo('Idade',
            <input type="number" value={form.idade} onChange={e => set('idade', e.target.value)}
              placeholder="Ex: 91" min="60" max="120" style={estiloInput} />
          )}
          {campo('Apelido / como gosta de ser chamado',
            <input type="text" value={form.apelido} onChange={e => set('apelido', e.target.value)}
              placeholder="Ex: Vovó, Dona Maria..." style={estiloInput} />
          )}
        </div>

        {/* Condição física */}
        <h2 style={{ fontSize: '16px', color: '#555', letterSpacing: '.06em', margin: '12px 0 20px', fontWeight: 500 }}>MOBILIDADE</h2>

        {campo('Condição física',
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {CONDICOES_FISICAS.map(op => {
              const sel = form.condicao_fisica === op;
              return (
                <button key={op} onClick={() => set('condicao_fisica', op)} style={{
                  fontSize: '18px', padding: '12px 20px', borderRadius: '10px', border: `2px solid ${sel ? '#0070f3' : '#2a2a2a'}`,
                  backgroundColor: sel ? '#061424' : '#1a1a1a', color: sel ? '#fff' : '#888',
                  cursor: 'pointer', fontWeight: sel ? 600 : 400, transition: 'all .15s',
                }}>
                  {op}
                </button>
              );
            })}
          </div>
        )}

        {/* Saúde */}
        <h2 style={{ fontSize: '16px', color: '#555', letterSpacing: '.06em', margin: '12px 0 20px', fontWeight: 500 }}>SAÚDE</h2>

        {campo('Doenças e condições de saúde',
          <textarea value={form.doencas} onChange={e => set('doencas', e.target.value)}
            placeholder="Ex: Hipertensão, diabetes tipo 2, Alzheimer inicial..." style={estiloTextarea} />
        )}

        {campo('Medicamentos que toma',
          <textarea value={form.medicamentos} onChange={e => set('medicamentos', e.target.value)}
            placeholder="Ex: Metformina 500mg (manhã e noite), Losartana 50mg (manhã)..." style={estiloTextarea} />
        )}

        {/* Limitações */}
        <h2 style={{ fontSize: '16px', color: '#555', letterSpacing: '.06em', margin: '12px 0 20px', fontWeight: 500 }}>LIMITAÇÕES</h2>

        {campo('Limitações físicas',
          <textarea value={form.limitacoes_fisicas} onChange={e => set('limitacoes_fisicas', e.target.value)}
            placeholder="Ex: Não enxerga bem do olho direito, dificuldade para ouvir sons altos..." style={estiloTextarea} />
        )}

        {campo('Limitações cognitivas',
          <textarea value={form.limitacoes_cognitivas} onChange={e => set('limitacoes_cognitivas', e.target.value)}
            placeholder="Ex: Memória recente reduzida, confusão às vezes no período da tarde..." style={estiloTextarea} />
        )}

        {/* Rotina */}
        <h2 style={{ fontSize: '16px', color: '#555', letterSpacing: '.06em', margin: '12px 0 20px', fontWeight: 500 }}>ROTINA</h2>

        {campo('Rotina diária resumida',
          <textarea value={form.rotina_diaria} onChange={e => set('rotina_diaria', e.target.value)}
            placeholder="Ex: Acorda às 7h, café com pão, novela das 9h, almoço às 12h, cochilo à tarde, jantar às 18h, dorme às 21h..." style={{ ...estiloTextarea, minHeight: '130px' }} />
        )}

        {/* Botão inferior */}
        <button
          onClick={salvar}
          disabled={salvando}
          style={{
            width: '100%', fontSize: '22px', padding: '18px',
            backgroundColor: salvando ? '#1a3a5c' : salvo ? '#1a4a2a' : '#0070f3',
            color: salvo ? '#2ecc71' : 'white', border: 'none', borderRadius: '14px',
            cursor: 'pointer', fontWeight: 700, marginTop: '12px', transition: 'all .2s',
          }}
        >
          {salvando ? 'Salvando...' : salvo ? '✓ Perfil salvo com sucesso!' : 'Salvar Perfil'}
        </button>

      </div>
    </div>
  );
}
