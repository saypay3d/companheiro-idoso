import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function POST(req) {
  const { nome, idade } = await req.json();
  const existing = await sql`SELECT id FROM usuarios WHERE nome = ${nome} LIMIT 1`;
  if (existing.length > 0) return Response.json(existing[0]);
  const result = await sql`INSERT INTO usuarios (nome, idade) VALUES (${nome}, ${idade}) RETURNING id`;
  return Response.json(result[0]);
}

export async function GET() {
  const result = await sql`SELECT * FROM usuarios`;
  return Response.json(result);
}
