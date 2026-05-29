'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [nome, setNome] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem('usuario_id')) router.push('/configurar');
  }, [router]);

  const iniciar = async () => {
    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, idade: 91 })
    });
    const user = await res.json();
    localStorage.setItem('usuario_id', user.id);
    router.push('/configurar');
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '40px' }}>
      <h1 style={{ fontSize: '48px' }}>Olá! Qual é o seu nome?</h1>
      <input
        type="text"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        style={{ fontSize: '24px', padding: '15px', width: '300px', marginBottom: '20px' }}
      />
      <button
        onClick={iniciar}
        style={{ fontSize: '28px', padding: '20px 40px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
      >
        Começar Conversa
      </button>
    </div>
  );
}
