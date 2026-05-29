'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const CONDICOES_FISICAS = [
  'Caminha sozinho',
  'Caminha com ajuda',
  'Cadeirante',
  'Acamado',
];

const estiloInput = {
  width: '100%', fontSize: '20px', padding: '14px 16px',
  backgroundColor: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: '12px',
  color: '#eee', outline: 'none', boxSizing: 'border-box',
};

const estiloTextarea = {
  ...estiloInput,
  minHeight: '100px', resize: 'vertical', lineHeight: 1.5,
};

const estiloSecao = {
  fontSize: '16px', color: '#555', letterSpacing: '.06em',
  margin: '12px 0 20px', fontWeight: 500,
};

function Campo({ label, children }) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <label style={{ display: 'block', fontSize: '17px', color: '#888', marginBottom: '8px', fontWeight: 500, letterSpacing: '.03em' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Divisor() {
  return <hr style={{ border: 'none', borderTop: '1px solid #1e1e1e', margin: '8px 0 24px' }} />;
}

export default function Perfil() {
  const router = useRouter();
  const [usuarioId, setUsuarioId] = useState(null);
  const [salvando,  setSalvando]  = useState(false);
  const [salvo,     setSalvo]     = useState(false);

  const [form, setForm] = useState({
    nome_completo: '', idade: '', apelido: '',
    condicao_fisica: 'Caminha sozinho',
    doencas: '', medicamentos: '',
    limitacoes_fisicas: '', limitacoes_cognitivas: '', rotina_diaria: '',
  });

  const [extra, setExtra] = useState({
    filhos: '', netos: '', outros_familiares: '', nome_cuidador: '',
    assuntos_gosta: '', assuntos_evitar: '',
    comidas_favoritas: '', programas_tv: '', musicas: '',
    religiao: '', observacoes: '',
  });

  useEffect(() => {
    const id = localStorage.getItem('usuario_id');
    if (!id) { router.push('/'); return; }
    setUsuarioId(id);

    fetch(`/api/perfil?usuario_id=${id}`)
      .then(r => r.json())
      .then(data => {
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
        setExtra({
          filhos:            data.filhos            ?? '',
          netos:             data.netos             ?? '',
          outros_familiares: data.outros_familiares ?? '',
          nome_cuidador:     data.nome_cuidador     ?? '',
          assuntos_gosta:    data.assuntos_gosta    ?? '',
          assuntos_evitar:   data.assuntos_evitar   ?? '',
          comidas_favoritas: data.comidas_favoritas ?? '',
          programas_tv:      data.programas_tv      ?? '',
          musicas:           data.musicas           ?? '',
          religiao:          data.religiao          ?? '',
          observacoes:       data.observacoes       ?? '',
        });
      })
      .catch(() => {});
  }, [router]);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setE = (k, v) => setExtra(e => ({ ...e, [k]: v }));

  async function salvar() {
    setSalvando(true);
    setSalvo(false);
    try {
      await fetch('/api/perfil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: usuarioId, ...form, ...extra }),
      });
      setSalvo(true);
      setTimeout(() => setSalvo(false), 3000);
    } finally {
      setSalvando(false);
    }
  }

  const btnSalvarStyle = {
    fontSize: '17px', padding: '10px 24px',
    backgroundColor: salvando ? '#1a3a5c' : salvo ? '#1a4a2a' : '#0070f3',
    color: salvo ? '#2ecc71' : 'white',
    border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, transition: 'all .2s',
  };

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
        <button onClick={salvar} disabled={salvando} style={btnSalvarStyle}>
          {salvando ? 'Salvando...' : salvo ? '✓ Salvo' : 'Salvar'}
        </button>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 20px 80px' }}>

        {/* ── IDENTIFICAÇÃO ── */}
        <h2 style={estiloSecao}>IDENTIFICAÇÃO</h2>

        <Campo label="Nome completo">
          <input type="text" value={form.nome_completo} onChange={e => setF('nome_completo', e.target.value)}
            placeholder="Nome completo do idoso" style={estiloInput} />
        </Campo>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Campo label="Idade">
            <input type="number" value={form.idade} onChange={e => setF('idade', e.target.value)}
              placeholder="Ex: 91" min="60" max="120" style={estiloInput} />
          </Campo>
          <Campo label="Apelido / como gosta de ser chamado">
            <input type="text" value={form.apelido} onChange={e => setF('apelido', e.target.value)}
              placeholder="Ex: Vovó, Dona Maria..." style={estiloInput} />
          </Campo>
        </div>

        <Divisor />

        {/* ── MOBILIDADE ── */}
        <h2 style={estiloSecao}>MOBILIDADE</h2>

        <Campo label="Condição física">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {CONDICOES_FISICAS.map(op => {
              const sel = form.condicao_fisica === op;
              return (
                <button key={op} onClick={() => setF('condicao_fisica', op)} style={{
                  fontSize: '18px', padding: '12px 20px', borderRadius: '10px',
                  border: `2px solid ${sel ? '#0070f3' : '#2a2a2a'}`,
                  backgroundColor: sel ? '#061424' : '#1a1a1a',
                  color: sel ? '#fff' : '#888',
                  cursor: 'pointer', fontWeight: sel ? 600 : 400, transition: 'all .15s',
                }}>
                  {op}
                </button>
              );
            })}
          </div>
        </Campo>

        <Divisor />

        {/* ── SAÚDE ── */}
        <h2 style={estiloSecao}>SAÚDE</h2>

        <Campo label="Doenças e condições de saúde">
          <textarea value={form.doencas} onChange={e => setF('doencas', e.target.value)}
            placeholder="Ex: Hipertensão, diabetes tipo 2, Alzheimer inicial..." style={estiloTextarea} />
        </Campo>

        <Campo label="Medicamentos que toma">
          <textarea value={form.medicamentos} onChange={e => setF('medicamentos', e.target.value)}
            placeholder="Ex: Metformina 500mg (manhã e noite), Losartana 50mg (manhã)..." style={estiloTextarea} />
        </Campo>

        <Divisor />

        {/* ── LIMITAÇÕES ── */}
        <h2 style={estiloSecao}>LIMITAÇÕES</h2>

        <Campo label="Limitações físicas">
          <textarea value={form.limitacoes_fisicas} onChange={e => setF('limitacoes_fisicas', e.target.value)}
            placeholder="Ex: Não enxerga bem do olho direito, dificuldade para ouvir sons altos..." style={estiloTextarea} />
        </Campo>

        <Campo label="Limitações cognitivas">
          <textarea value={form.limitacoes_cognitivas} onChange={e => setF('limitacoes_cognitivas', e.target.value)}
            placeholder="Ex: Memória recente reduzida, confusão às vezes no período da tarde..." style={estiloTextarea} />
        </Campo>

        <Divisor />

        {/* ── ROTINA ── */}
        <h2 style={estiloSecao}>ROTINA</h2>

        <Campo label="Rotina diária resumida">
          <textarea value={form.rotina_diaria} onChange={e => setF('rotina_diaria', e.target.value)}
            placeholder="Ex: Acorda às 7h, café com pão, novela das 9h, almoço às 12h, cochilo à tarde..." style={{ ...estiloTextarea, minHeight: '120px' }} />
        </Campo>

        <Divisor />

        {/* ── FAMÍLIA ── */}
        <h2 style={estiloSecao}>FAMÍLIA</h2>

        <Campo label="Filhos — nomes e parentesco">
          <textarea value={extra.filhos} onChange={e => setE('filhos', e.target.value)}
            placeholder="Ex: Ana (filha mais velha), Roberto (filho caçula)..." style={estiloTextarea} />
        </Campo>

        <Campo label="Netos — nomes">
          <textarea value={extra.netos} onChange={e => setE('netos', e.target.value)}
            placeholder="Ex: Pedro (15 anos), Clara (8 anos)..." style={estiloTextarea} />
        </Campo>

        <Campo label="Outros familiares importantes">
          <textarea value={extra.outros_familiares} onChange={e => setE('outros_familiares', e.target.value)}
            placeholder="Ex: Irmã Lurdes, sobrinho Carlos que mora perto..." style={estiloTextarea} />
        </Campo>

        <Divisor />

        {/* ── CUIDADOR ── */}
        <h2 style={estiloSecao}>CUIDADOR</h2>

        <Campo label="Nome do cuidador principal">
          <input type="text" value={extra.nome_cuidador} onChange={e => setE('nome_cuidador', e.target.value)}
            placeholder="Ex: Maria das Graças, Enfermeira Joana..." style={estiloInput} />
        </Campo>

        <Divisor />

        {/* ── CONVERSAS ── */}
        <h2 style={estiloSecao}>CONVERSAS</h2>

        <Campo label="Assuntos que gosta de conversar">
          <textarea value={extra.assuntos_gosta} onChange={e => setE('assuntos_gosta', e.target.value)}
            placeholder="Ex: Histórias da juventude, receitas de comida, novelas, religião..." style={estiloTextarea} />
        </Campo>

        <Campo label="Assuntos que devem ser evitados">
          <textarea value={extra.assuntos_evitar} onChange={e => setE('assuntos_evitar', e.target.value)}
            placeholder="Ex: Morte, doenças graves, notícias violentas, briga familiar..." style={estiloTextarea} />
        </Campo>

        <Divisor />

        {/* ── PREFERÊNCIAS ── */}
        <h2 style={estiloSecao}>PREFERÊNCIAS</h2>

        <Campo label="Comidas favoritas">
          <textarea value={extra.comidas_favoritas} onChange={e => setE('comidas_favoritas', e.target.value)}
            placeholder="Ex: Feijão tropeiro, caldo de frango, bolo de fubá, laranja..." style={estiloTextarea} />
        </Campo>

        <Campo label="Programas de TV favoritos">
          <textarea value={extra.programas_tv} onChange={e => setE('programas_tv', e.target.value)}
            placeholder="Ex: Novela das 9h da Globo, Jornal Nacional, Faustão..." style={estiloTextarea} />
        </Campo>

        <Campo label="Músicas que gosta">
          <textarea value={extra.musicas} onChange={e => setE('musicas', e.target.value)}
            placeholder="Ex: Sertanejo antigo, Roberto Carlos, música religiosa..." style={estiloTextarea} />
        </Campo>

        <Campo label="Religião / fé">
          <input type="text" value={extra.religiao} onChange={e => setE('religiao', e.target.value)}
            placeholder="Ex: Católica praticante, vai à missa aos domingos..." style={estiloInput} />
        </Campo>

        <Divisor />

        {/* ── OBSERVAÇÕES ── */}
        <h2 style={estiloSecao}>OBSERVAÇÕES EXTRAS</h2>

        <Campo label="Outras informações importantes">
          <textarea value={extra.observacoes} onChange={e => setE('observacoes', e.target.value)}
            placeholder="Qualquer detalhe adicional que a IA deve saber sobre o idoso..." style={{ ...estiloTextarea, minHeight: '140px' }} />
        </Campo>

        {/* Botão inferior */}
        <button
          onClick={salvar}
          disabled={salvando}
          style={{
            width: '100%', fontSize: '22px', padding: '18px',
            backgroundColor: salvando ? '#1a3a5c' : salvo ? '#1a4a2a' : '#0070f3',
            color: salvo ? '#2ecc71' : 'white',
            border: 'none', borderRadius: '14px',
            cursor: 'pointer', fontWeight: 700, marginTop: '12px', transition: 'all .2s',
          }}
        >
          {salvando ? 'Salvando...' : salvo ? '✓ Perfil salvo com sucesso!' : 'Salvar Perfil'}
        </button>

      </div>
    </div>
  );
}
