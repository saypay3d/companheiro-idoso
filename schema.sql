CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100),
  idade INT,
  data_criacao TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversas (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id),
  mensagem_usuario TEXT,
  mensagem_ia TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  modo_teste BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS perfil_usuario (
  usuario_id INT PRIMARY KEY REFERENCES usuarios(id),
  gostos TEXT,
  medicamentos TEXT,
  horarios_agua TEXT,
  observacoes TEXT
);
