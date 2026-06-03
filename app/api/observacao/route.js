import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function POST(req) {
  await sql`
    CREATE TABLE IF NOT EXISTS observacoes (
      id           SERIAL PRIMARY KEY,
      usuario_id   INT REFERENCES usuarios(id),
      solicitado_em TIMESTAMP DEFAULT NOW(),
      video        TEXT,
      respondido   BOOLEAN DEFAULT false
    )`;

  const { usuario_id } = await req.json();
  const result = await sql`
    INSERT INTO observacoes (usuario_id)
    VALUES (${usuario_id})
    RETURNING id, solicitado_em`;

  return Response.json(result[0]);
}
