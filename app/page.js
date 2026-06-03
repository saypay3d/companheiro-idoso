'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [etapa, setEtapa] = useState('senha');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem('usuario_id')) router.push('/configurar');
  }, [router]);

  const verificarSenha = async () => {
    setErro('');
    const res = await fetch('/api/verificar-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha })
    });
    const data = await res.json();
    if (data.ok) {
      setEtapa('nome');
    } else {
      setErro('Senha incorreta. Tente novamente.');
    }
  };

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

  if (etapa === 'senha') {
    return (
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <h1 style={{ fontSize: '48px' }}>Bem-vindo!</h1>
        <p style={{ fontSize: '24px' }}>Digite a senha de acesso:</p>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && verificarSenha()}
          style={{ fontSize: '24px', padding: '15px', width: '300px', marginBottom: '20px' }}
        />
        {erro && <p style={{ color: 'red', fontSize: '20px' }}>{erro}</p>}
        <br />
        <button
          onClick={verificarSenha}
          style={{ fontSize: '28px', padding: '20px 40px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          Entrar
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '40px' }}>
      <h1 style={{ fontSize: '48px' }}>Olá! Qual é o seu nome?</h1>
      <input
        type="text"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && iniciar()}
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
