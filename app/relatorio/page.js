'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function formatarHora(isoStr) {
  return new Date(isoStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatarData(d) {
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}

const COR_TIPO = {
  conversa: '#2ecc71',
  barulho:  '#e67e22',
  silencio: '#4a7f9f',
};

const LABEL_TIPO = {
  conversa: 'Conversa',
  barulho:  'Barulho',
  silencio: 'Silêncio',
};

export default function Relatorio() {
  const [atividades, setAtividades] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro,       setErro]       = useState('');
  const [dataRef,    setDataRef]    = useState('');
  const router = useRouter();

  useEffect(() => {
    const id = localStorage.getItem('usuario_id');
    if (!id) { router.push('/'); return; }

    const hoje  = new Date();
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 1, 0, 0);
    const fim    = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 7, 0, 0);

    setDataRef(formatarData(hoje));

    fetch(`/api/relatorio?usuario_id=${id}&inicio=${inicio.toISOString()}&fim=${fim.toISOString()}`)
      .then(r => r.json())
      .then(data => {
        if (data.erro) { setErro(data.erro); return; }
        setAtividades(data.atividades);
      })
      .catch(() => setErro('Erro ao carregar relatório.'))
      .finally(() => setCarregando(false));
  }, [router]);

  // ── Resumo calculado ──
  const conversas  = atividades?.filter(a => a.tipo === 'conversa')  ?? [];
  const barulhos   = atividades?.filter(a => a.tipo === 'barulho')   ?? [];
  const silencias  = atividades?.filter(a => a.tipo === 'silencio')  ?? [];

  const horariosAtividade = conversas.map(a => formatarHora(a.horario));

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
          <h1 style={{ margin: 0, fontSize: '22px', color: '#eee', fontWeight: 600 }}>Relatório Noturno</h1>
          <p style={{ margin: '2px 0 0', fontSize: '14px', color: '#555', textTransform: 'capitalize' }}>{dataRef} · 1h às 7h</p>
        </div>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '24px 16px 48px' }}>

        {carregando && (
          <p style={{ textAlign: 'center', color: '#555', fontSize: '18px', marginTop: '60px' }}>Carregando...</p>
        )}

        {erro && (
          <p style={{ textAlign: 'center', color: '#e74c3c', fontSize: '18px', marginTop: '60px' }}>{erro}</p>
        )}

        {atividades && (
          <>
            {/* ── Resumo ── */}
            <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #222', borderRadius: '16px', padding: '20px 24px', marginBottom: '28px' }}>
              <h2 style={{ margin: '0 0 16px', fontSize: '18px', color: '#aaa', fontWeight: 500, letterSpacing: '.04em' }}>
                RESUMO DA NOITE
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {[
                  { label: 'Conversas',   valor: conversas.length,  cor: '#2ecc71' },
                  { label: 'Barulhos',    valor: barulhos.length,   cor: '#e67e22' },
                  { label: 'Silêncios',   valor: silencias.length,  cor: '#4a7f9f' },
                ].map(({ label, valor, cor }) => (
                  <div key={label} style={{ textAlign: 'center', backgroundColor: '#242424', borderRadius: '12px', padding: '14px 8px' }}>
                    <p style={{ margin: 0, fontSize: '32px', fontWeight: 700, color: cor }}>{valor}</p>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>{label}</p>
                  </div>
                ))}
              </div>

              {horariosAtividade.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#555', letterSpacing: '.04em' }}>HORÁRIOS DE CONVERSA</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {horariosAtividade.map((h, i) => (
                      <span key={i} style={{ backgroundColor: '#1e3a24', color: '#2ecc71', borderRadius: '20px', padding: '4px 12px', fontSize: '14px', fontWeight: 600 }}>
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {silencias.length > 0 && (
                <div style={{ marginTop: '12px', backgroundColor: '#181e24', borderRadius: '10px', padding: '10px 14px' }}>
                  <p style={{ margin: 0, fontSize: '14px', color: '#4a7f9f' }}>
                    ⏳ {silencias.length === 1 ? '1 período longo de silêncio registrado' : `${silencias.length} períodos longos de silêncio registrados`}
                    {silencias.length > 0 && ` (primeiro às ${formatarHora(silencias[0].horario)})`}
                  </p>
                </div>
              )}

              {atividades.length === 0 && (
                <p style={{ margin: 0, fontSize: '16px', color: '#555', textAlign: 'center' }}>
                  Nenhuma atividade registrada entre 1h e 7h.
                </p>
              )}
            </div>

            {/* ── Lista cronológica ── */}
            {atividades.length > 0 && (
              <>
                <h2 style={{ fontSize: '16px', color: '#555', fontWeight: 500, letterSpacing: '.04em', margin: '0 0 14px' }}>
                  LINHA DO TEMPO
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {atividades.map((a, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '14px',
                      backgroundColor: '#1a1a1a', border: '1px solid #222',
                      borderLeft: `4px solid ${COR_TIPO[a.tipo] ?? '#444'}`,
                      borderRadius: '10px', padding: '12px 16px',
                    }}>
                      <span style={{ fontSize: '13px', color: '#555', whiteSpace: 'nowrap', paddingTop: '2px', minWidth: '40px' }}>
                        {formatarHora(a.horario)}
                      </span>
                      <div>
                        <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.06em', color: COR_TIPO[a.tipo] ?? '#888' }}>
                          {LABEL_TIPO[a.tipo] ?? a.tipo}
                        </span>
                        <p style={{ margin: '3px 0 0', fontSize: '15px', color: '#ccc', lineHeight: 1.4 }}>
                          {a.descricao}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
