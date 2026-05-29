import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuario_id = searchParams.get('usuario_id');
  const inicio     = searchParams.get('inicio'); // ISO string local 01:00
  const fim        = searchParams.get('fim');    // ISO string local 07:00

  if (!usuario_id || !inicio || !fim) {
    return Response.json({ erro: 'Parâmetros obrigatórios: usuario_id, inicio, fim' }, { status: 400 });
  }

  const atividades = await sql`
    SELECT tipo, descricao, horario
    FROM atividade_noturna
    WHERE usuario_id = ${usuario_id}
      AND horario >= ${inicio}::timestamptz
      AND horario <  ${fim}::timestamptz
    ORDER BY horario ASC`;

  return Response.json({ atividades });
}
