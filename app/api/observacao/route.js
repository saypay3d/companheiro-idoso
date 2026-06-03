import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function POST(req) {
  await sql`
    CREATE TABLE IF NOT EXISTS observacoes (
      id            SERIAL PRIMARY KEY,
      usuario_id    INT REFERENCES usuarios(id),
      solicitado_em TIMESTAMP DEFAULT NOW(),
      video         TEXT,
      respondido    BOOLEAN DEFAULT false
    )`;

  const { usuario_id } = await req.json();
  const result = await sql`
    INSERT INTO observacoes (usuario_id)
    VALUES (${usuario_id})
    RETURNING id, solicitado_em`;

  return Response.json(result[0]);
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuario_id = searchParams.get('usuario_id');
  const rows = await sql`
    SELECT id FROM observacoes
    WHERE usuario_id = ${usuario_id} AND respondido = false
    ORDER BY solicitado_em DESC
    LIMIT 1`;
  return Response.json(rows[0] ?? null);
}

export async function PATCH(req) {
  const { id, video } = await req.json();
  await sql`
    UPDATE observacoes
    SET video = ${video}, respondido = true
    WHERE id = ${id}`;
  return Response.json({ ok: true });
}
