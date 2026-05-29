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
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem('usuario_id')) { router.push('/'); return; }
    const av = localStorage.getItem('avatar_tipo');
    const vz = localStorage.getItem('voz_tipo');
    if (av) setAvatarEscolhido(av);
    if (vz) setVozEscolhida(vz);
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
      `}</style>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '28px 16px 40px', textAlign: 'center' }}>

        <h1 style={{ fontSize: '34px', margin: '0 0 6px', color: 'white' }}>
          Como você quer que eu seja?
        </h1>
        <p style={{ fontSize: '22px', color: '#777', margin: '0 0 36px' }}>
          Escolha seu companheiro virtual
        </p>

        {/* Seleção de avatar */}
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
                <p style={{ fontSize: '24px', margin: '0 0 4px', color: selecionado ? '#fff' : '#aaa', fontWeight: selecionado ? 700 : 400 }}>
                  {nome}
                </p>
                <p style={{ fontSize: '16px', margin: 0, color: selecionado ? '#88aadd' : '#555' }}>
                  {desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Seleção de voz */}
        <h2 style={{ fontSize: '28px', color: '#bbb', margin: '0 0 18px', fontWeight: 300 }}>
          Escolha a voz:
        </h2>
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', marginBottom: '44px', flexWrap: 'wrap' }}>
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
              </button>
            );
          })}
        </div>

        {/* Botão começar */}
        <button
          onClick={comecar}
          style={{
            fontSize: '30px',
            padding: '22px 64px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '18px',
            cursor: 'pointer',
            fontWeight: 700,
            boxShadow: '0 6px 24px rgba(0,112,243,.55)',
            transition: 'transform .1s',
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(.97)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          Começar! →
        </button>
      </div>
    </>
  );
}
