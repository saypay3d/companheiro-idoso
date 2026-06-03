'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem('usuario_id')) router.push('/configurar');
    else if (localStorage.getItem('is_admin')) router.push('/admin');
  }, [router]);

  const entrar = async () => {
    setErro('');
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, senha }),
    });
    const data = await res.json();
    if (data.role === 'admin') {
      localStorage.setItem('is_admin', 'true');
      router.push('/admin');
    } else if (data.role === 'usuario') {
      localStorage.setItem('usuario_id', data.id);
      router.push('/configurar');
    } else {
      setErro(data.erro || 'Nome ou senha incorretos.');
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '40px' }}>
      <h1 style={{ fontSize: '48px' }}>Bem-vindo!</h1>
      <p style={{ fontSize: '24px' }}>Digite seu nome e senha:</p>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
        <input
          type="text"
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          style={{ fontSize: '24px', padding: '15px', width: '300px' }}
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && entrar()}
          style={{ fontSize: '24px', padding: '15px', width: '300px' }}
        />
        {erro && <p style={{ color: 'red', fontSize: '20px' }}>{erro}</p>}
        <button
          onClick={entrar}
          style={{ fontSize: '28px', padding: '20px 40px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          Entrar
        </button>
      </div>
    </div>
  );
}
