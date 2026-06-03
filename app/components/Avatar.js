'use client';
import { useEffect, useRef } from 'react';

const CSS = `
  @keyframes av-atencao {
    0%, 100% { transform: rotate(0deg) translateY(0); }
    30%       { transform: rotate(-4deg) translateY(-1.5%); }
    70%       { transform: rotate(4deg)  translateY(-1.5%); }
  }
  @keyframes av-pensar {
    0%, 100% { transform: rotate(-5deg) translateY(0)    scale(0.96); }
    50%       { transform: rotate(-7deg) translateY(-2%)  scale(1); }
  }
  @keyframes av-falar {
    0%   { transform: scaleY(1)    translateY(0); }
    20%  { transform: scaleY(1.03) translateY(-2%); }
    50%  { transform: scaleY(0.97) translateY(1%); }
    80%  { transform: scaleY(1.03) translateY(-1%); }
    100% { transform: scaleY(1)    translateY(0); }
  }
  @keyframes av-respirar {
    0%, 100% { transform: scale(1)     translateY(0); }
    50%       { transform: scale(1.025) translateY(-1%); }
  }
  @keyframes av-agitar {
    0%, 100% { transform: translateX(0)    rotate(0deg); }
    25%       { transform: translateX(-2%) rotate(-2deg); }
    75%       { transform: translateX(2%)  rotate(2deg); }
  }
`;

const ANIM = {
  ouvindo:    { animation: 'av-atencao 3.5s ease-in-out infinite', transformOrigin: 'center 85%' },
  pensando:   { animation: 'av-pensar  3s   ease-in-out infinite', transformOrigin: 'center 85%' },
  falando:    { animation: 'av-falar   0.6s ease-in-out infinite', transformOrigin: 'center center' },
  silencio:   { animation: 'av-respirar 5s  ease-in-out infinite', transformOrigin: 'center center' },
  vigia:      { animation: 'av-respirar 7s  ease-in-out infinite', transformOrigin: 'center center' },
  preocupado: { animation: 'av-agitar  1.1s ease-in-out infinite', transformOrigin: 'center center' },
  iniciando:  { animation: 'av-respirar 3s  ease-in-out infinite', transformOrigin: 'center center' },
};

const VELOCIDADE = {
  iniciando:  1,
  ouvindo:    1,
  pensando:   0.6,
  falando:    1.4,
  vigia:      0.35,
  preocupado: 1.2,
  silencio:   0.4,
};

export default function Avatar({ tipo = 'vovo', estado = 'ouvindo' }) {
  const containerRef = useRef(null);
  const animRef      = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let destroyed = false;

    import('lottie-web').then(mod => {
      if (destroyed || !containerRef.current) return;
      const lottie = mod.default;
      if (animRef.current) { animRef.current.destroy(); animRef.current = null; }

      animRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer:  'svg',
        loop:      true,
        autoplay:  true,
        path:      `/animations/${tipo}.json`,
      });
    });

    return () => {
      destroyed = true;
      animRef.current?.destroy();
      animRef.current = null;
    };
  }, [tipo]);

  useEffect(() => {
    if (!animRef.current) return;
    animRef.current.setSpeed(VELOCIDADE[estado] ?? 1);
  }, [estado]);

  return (
    <>
      <style>{CSS}</style>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', ...(ANIM[estado] ?? {}) }}
      />
    </>
  );
}
