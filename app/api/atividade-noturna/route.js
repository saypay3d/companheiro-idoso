import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function POST(req) {
  const { usuario_id, tipo, descricao } = await req.json();
  await sql`INSERT INTO atividade_noturna (usuario_id, tipo, descricao)
            VALUES (${usuario_id}, ${tipo}, ${descricao})`;
  console.log('[atividade_noturna] salvo:', tipo, '|', descricao);
  return Response.json({ ok: true });
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuario_id = searchParams.get('usuario_id');
  const result = await sql`
    SELECT tipo, descricao, horario FROM atividade_noturna
    WHERE usuario_id = ${usuario_id}
    ORDER BY horario DESC LIMIT 100`;
  return Response.json(result);
}
