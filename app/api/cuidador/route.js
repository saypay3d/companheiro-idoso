import { neon } from '@neondatabase/serverless';
import { randomUUID } from 'crypto';

const sql = neon(process.env.DATABASE_URL);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  if (!token) return Response.json({ error: 'Token obrigatório' }, { status: 400 });

  const rows = await sql`
    SELECT id, nome, cuidador_nome
    FROM usuarios
    WHERE cuidador_token = ${token}
    LIMIT 1`;

  if (rows.length === 0) return Response.json({ error: 'Token inválido' }, { status: 404 });
  return Response.json(rows[0]);
}

export async function POST(req) {
  await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cuidador_nome  VARCHAR(100)`.catch(() => {});
  await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cuidador_token VARCHAR(50)`.catch(() => {});

  const { usuario_id, cuidador_nome } = await req.json();
  const token = randomUUID().replace(/-/g, '');

  await sql`
    UPDATE usuarios
    SET cuidador_nome = ${cuidador_nome}, cuidador_token = ${token}
    WHERE id = ${usuario_id}`;

  return Response.json({ token });
}
