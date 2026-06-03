import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function garantirTabela() {
  await sql`
    CREATE TABLE IF NOT EXISTS mensagens_cuidador (
      id         SERIAL PRIMARY KEY,
      usuario_id INT REFERENCES usuarios(id),
      de_nome    VARCHAR(100),
      mensagem   TEXT,
      resposta   TEXT,
      criado_em  TIMESTAMP DEFAULT NOW()
    )`;
}

export async function POST(req) {
  await garantirTabela();
  const { usuario_id, de_nome, mensagem } = await req.json();
  const result = await sql`
    INSERT INTO mensagens_cuidador (usuario_id, de_nome, mensagem)
    VALUES (${usuario_id}, ${de_nome}, ${mensagem})
    RETURNING id, criado_em`;
  return Response.json(result[0]);
}

export async function GET(req) {
  await garantirTabela();
  const { searchParams } = new URL(req.url);
  const usuario_id = searchParams.get('usuario_id');
  const rows = await sql`
    SELECT id, de_nome, mensagem, resposta, criado_em
    FROM mensagens_cuidador
    WHERE usuario_id = ${usuario_id}
    ORDER BY criado_em DESC
    LIMIT 50`;
  return Response.json(rows);
}
