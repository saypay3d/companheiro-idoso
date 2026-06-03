import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function GET() {
  await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS senha VARCHAR(50)`.catch(() => {});
  const result = await sql`
    SELECT id, nome, idade, data_criacao,
           (senha IS NOT NULL AND senha <> '') AS tem_senha
    FROM usuarios ORDER BY nome ASC`;
  return Response.json(result);
}

export async function POST(req) {
  const { nome, idade, senha } = await req.json();
  const existing = await sql`SELECT id FROM usuarios WHERE nome = ${nome} LIMIT 1`;
  if (existing.length > 0) return Response.json(existing[0]);
  const result = await sql`
    INSERT INTO usuarios (nome, idade, senha)
    VALUES (${nome}, ${idade || 91}, ${senha || null})
    RETURNING id`;
  return Response.json(result[0]);
}

export async function PATCH(req) {
  const { id, senha } = await req.json();
  await sql`UPDATE usuarios SET senha = ${senha} WHERE id = ${id}`;
  return Response.json({ ok: true });
}
