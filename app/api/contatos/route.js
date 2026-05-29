import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuario_id = searchParams.get('usuario_id');
  const rows = await sql`
    SELECT id, nome, telefone FROM contatos
    WHERE usuario_id = ${usuario_id}
    ORDER BY nome ASC`;
  return Response.json(rows);
}

export async function POST(req) {
  const { usuario_id, nome, telefone } = await req.json();
  const [row] = await sql`
    INSERT INTO contatos (usuario_id, nome, telefone)
    VALUES (${usuario_id}, ${nome}, ${telefone})
    RETURNING id, nome, telefone`;
  return Response.json(row);
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const id         = searchParams.get('id');
  const usuario_id = searchParams.get('usuario_id');
  await sql`DELETE FROM contatos WHERE id = ${id} AND usuario_id = ${usuario_id}`;
  return Response.json({ ok: true });
}
