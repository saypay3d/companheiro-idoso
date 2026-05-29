import { neon } from '@neondatabase/serverless';

export async function POST(req) {
  const sql = neon(process.env.DATABASE_URL);
  const { nome, idade } = await req.json();
  const result = await sql('INSERT INTO usuarios (nome, idade) VALUES ($1, $2) RETURNING id', [nome, idade]);
  return Response.json(result[0]);
}

export async function GET() {
  const sql = neon(process.env.DATABASE_URL);
  const result = await sql('SELECT * FROM usuarios');
  return Response.json(result);
}
