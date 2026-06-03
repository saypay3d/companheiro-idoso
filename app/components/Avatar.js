'use client';
import { useEffect, useRef } from 'react';

const VELOCIDADE = {
  iniciando:  1,
  ouvindo:    1,
  pensando:   0.65,
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

      if (animRef.current) {
        animRef.current.destroy();
        animRef.current = null;
      }

      animRef.current = lottie.loadAnimation({
        container:  containerRef.current,
        renderer:   'svg',
        loop:       true,
        autoplay:   true,
        path:       `/animations/${tipo}.json`,
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
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
