import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function POST(req) {
  const { nome, senha } = await req.json();

  if (senha === process.env.APP_SENHA) {
    return Response.json({ role: 'admin' });
  }

  const rows = await sql`
    SELECT id FROM usuarios
    WHERE LOWER(TRIM(nome)) = LOWER(TRIM(${nome})) AND senha = ${senha}
    LIMIT 1`;

  if (rows.length > 0) {
    return Response.json({ role: 'usuario', id: rows[0].id });
  }

  return Response.json({ ok: false, erro: 'Nome ou senha incorretos.' });
}
