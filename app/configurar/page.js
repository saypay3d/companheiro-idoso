'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Avatar from '../components/Avatar';

const AVATARES = [
  { tipo: 'vovo', nome: 'Vovozinha', desc: 'Com óculos e sorriso carinhoso' },
  { tipo: 'gato', nome: 'Gatinho',   desc: 'Fofo com olhos expressivos' },
  { tipo: 'robo', nome: 'Robozinho', desc: 'Amigável com olhos luminosos' },
];

export default function Configurar() {
  const [avatarEscolhido, setAvatarEscolhido] = useState('vovo');
  const [vozEscolhida, setVozEscolhida]       = useState('feminina');
  const [nomeUsuario,   setNomeUsuario]        = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem('usuario_id')) { router.push('/'); return; }
    const av = localStorage.getItem('avatar_tipo');
    const vz = localStorage.getItem('voz_tipo');
    if (av) setAvatarEscolhido(av);
    if (vz) setVozEscolhida(vz);

    // Busca o nome para personalizar a saudação
    const id = localStorage.getItem('usuario_id');
    fetch('/api/usuarios')
      .then(r => r.json())
      .then(data => {
        const user = data.find(u => String(u.id) === String(id));
        if (user) setNomeUsuario(user.nome);
      })
      .catch(() => {});
  }, [router]);

  const comecar = () => {
    localStorage.setItem('avatar_tipo', avatarEscolhido);
    localStorage.setItem('voz_tipo',    vozEscolhida);
    router.push('/conversa');
  };

  return (
    <>
      <style>{`
        .cfg-card {
          cursor: pointer;
          border-radius: 20px;
          padding: 16px 12px;
          flex: 1 1 130px;
          max-width: 210px;
          transition: all .25s;
          text-align: center;
        }
        .cfg-card:hover { transform: translateY(-4px); }
        .cfg-voz {
          flex: 1;
          font-size: 24px;
          padding: 20px 16px;
          border-radius: 16px;
          cursor: pointer;
          transition: all .25s;
          font-weight: 500;
          border-width: 3px;
          border-style: solid;
        }
        .cfg-voz:hover { transform: translateY(-2px); }
        .btn-iniciar {
          font-size: 32px;
          padding: 24px 72px;
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          font-weight: 700;
          box-shadow: 0 8px 32px rgba(0,112,243,.6);
          transition: transform .1s, box-shadow .1s;
          width: 100%;
          max-width: 480px;
          margin-top: 12px;
        }
        .btn-iniciar:hover { box-shadow: 0 10px 40px rgba(0,112,243,.75); }
        .btn-iniciar:active { transform: scale(.97); box-shadow: 0 4px 16px rgba(0,112,243,.5); }
      `}</style>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '28px 16px 48px', textAlign: 'center' }}>

        {/* Saudação */}
        <h1 style={{ fontSize: '34px', margin: '0 0 6px', color: 'white' }}>
          {nomeUsuario ? `Olá, ${nomeUsuario}!` : 'Olá!'}
        </h1>
        <p style={{ fontSize: '20px', color: '#666', margin: '0 0 36px' }}>
          Confirme ou altere suas preferências
        </p>

        {/* Seleção de avatar */}
        <h2 style={{ fontSize: '26px', color: '#bbb', margin: '0 0 18px', fontWeight: 300 }}>
          Escolha o companheiro:
        </h2>
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', marginBottom: '40px', flexWrap: 'wrap' }}>
          {AVATARES.map(({ tipo, nome, desc }) => {
            const selecionado = avatarEscolhido === tipo;
            return (
              <div
                key={tipo}
                className="cfg-card"
                onClick={() => setAvatarEscolhido(tipo)}
                style={{
                  border: `3px solid ${selecionado ? '#0070f3' : '#2a2a2a'}`,
                  backgroundColor: selecionado ? '#061424' : '#1a1a1a',
                  boxShadow: selecionado ? '0 0 24px rgba(0,112,243,.45)' : 'none',
                }}
              >
                <div style={{
                  width: 'min(130px, calc(30vw - 16px))',
                  height: 'min(130px, calc(30vw - 16px))',
                  margin: '0 auto 14px',
                }}>
                  <Avatar tipo={tipo} estado="ouvindo" />
                </div>
                <p style={{ fontSize: '22px', margin: '0 0 4px', color: selecionado ? '#fff' : '#aaa', fontWeight: selecionado ? 700 : 400 }}>
                  {nome}
                </p>
                {selecionado && (
                  <p style={{ fontSize: '13px', margin: '4px 0 0', color: '#4a9eff', fontWeight: 600, letterSpacing: '.05em' }}>
                    ✓ SELECIONADO
                  </p>
                )}
                <p style={{ fontSize: '15px', margin: '4px 0 0', color: selecionado ? '#88aadd' : '#555' }}>
                  {desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Seleção de voz */}
        <h2 style={{ fontSize: '26px', color: '#bbb', margin: '0 0 18px', fontWeight: 300 }}>
          Escolha a voz:
        </h2>
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', marginBottom: '48px', flexWrap: 'wrap' }}>
          {[
            { voz: 'feminina', emoji: '🎀', label: 'Voz Feminina' },
            { voz: 'masculina', emoji: '🎵', label: 'Voz Masculina' },
          ].map(({ voz, emoji, label }) => {
            const sel = vozEscolhida === voz;
            return (
              <button
                key={voz}
                className="cfg-voz"
                onClick={() => setVozEscolhida(voz)}
                style={{
                  borderColor: sel ? '#0070f3' : '#2a2a2a',
                  backgroundColor: sel ? '#061424' : '#1a1a1a',
                  color: sel ? '#fff' : '#888',
                  boxShadow: sel ? '0 0 20px rgba(0,112,243,.4)' : 'none',
                  minWidth: '180px',
                }}
              >
                {emoji} {label}
                {sel && <span style={{ display: 'block', fontSize: '13px', color: '#4a9eff', fontWeight: 600, marginTop: '4px' }}>✓ SELECIONADA</span>}
              </button>
            );
          })}
        </div>

        {/* Botão iniciar */}
        <button className="btn-iniciar" onClick={comecar}>
          Iniciar Conversa
        </button>

        {/* Links discretos */}
        <div style={{ marginTop: '28px', display: 'flex', gap: '24px', justifyContent: 'center' }}>
          <button
            onClick={() => router.push('/relatorio')}
            style={{ background: 'transparent', border: 'none', color: '#444', fontSize: '15px', cursor: 'pointer', textDecoration: 'underline', padding: '8px' }}
          >
            Relatório Noturno
          </button>
          <button
            onClick={() => router.push('/contatos')}
            style={{ background: 'transparent', border: 'none', color: '#444', fontSize: '15px', cursor: 'pointer', textDecoration: 'underline', padding: '8px' }}
          >
            Contatos
          </button>
          <button
            onClick={() => router.push('/perfil')}
            style={{ background: 'transparent', border: 'none', color: '#444', fontSize: '15px', cursor: 'pointer', textDecoration: 'underline', padding: '8px' }}
          >
            Perfil do Idoso
          </button>
        </div>

      </div>
    </>
  );
}
