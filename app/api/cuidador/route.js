import { neon } from '@neondatabase/serverless';
import { randomUUID } from 'crypto';

const sql = neon(process.env.DATABASE_URL);

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
