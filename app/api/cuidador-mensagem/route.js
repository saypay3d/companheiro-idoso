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
      lida       BOOLEAN DEFAULT false,
      criado_em  TIMESTAMP DEFAULT NOW()
    )`;
  await sql`ALTER TABLE mensagens_cuidador ADD COLUMN IF NOT EXISTS lida BOOLEAN DEFAULT false`.catch(() => {});
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
  const nao_lida   = searchParams.get('nao_lida') === 'true';

  if (nao_lida) {
    const rows = await sql`
      SELECT id, de_nome, mensagem, criado_em
      FROM mensagens_cuidador
      WHERE usuario_id = ${usuario_id} AND lida = false
      ORDER BY criado_em ASC
      LIMIT 1`;
    return Response.json(rows);
  }

  const rows = await sql`
    SELECT id, de_nome, mensagem, resposta, lida, criado_em
    FROM mensagens_cuidador
    WHERE usuario_id = ${usuario_id}
    ORDER BY criado_em DESC
    LIMIT 50`;
  return Response.json(rows);
}

export async function PATCH(req) {
  await garantirTabela();
  const { id, resposta, lida } = await req.json();
  if (resposta !== undefined) {
    await sql`UPDATE mensagens_cuidador SET resposta = ${resposta}, lida = true  WHERE id = ${id}`;
  } else {
    await sql`UPDATE mensagens_cuidador SET lida = ${lida ?? true}               WHERE id = ${id}`;
  }
  return Response.json({ ok: true });
}
