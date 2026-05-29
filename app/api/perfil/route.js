import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuario_id = searchParams.get('usuario_id');

  const [rows, perfilCompleto] = await Promise.all([
    sql`SELECT * FROM perfil_cuidador WHERE usuario_id = ${usuario_id}`,
    sql`SELECT campo, valor FROM perfil_completo
        WHERE usuario_id = ${usuario_id} AND valor != ''`,
  ]);

  const base  = rows[0] ?? {};
  const extra = Object.fromEntries(perfilCompleto.map(p => [p.campo, p.valor]));
  return Response.json({ ...base, ...extra });
}

export async function POST(req) {
  const {
    usuario_id, nome_completo, idade, apelido, condicao_fisica,
    doencas, medicamentos, limitacoes_fisicas, limitacoes_cognitivas, rotina_diaria,
  } = await req.json();

  const [row] = await sql`
    INSERT INTO perfil_cuidador
      (usuario_id, nome_completo, idade, apelido, condicao_fisica,
       doencas, medicamentos, limitacoes_fisicas, limitacoes_cognitivas, rotina_diaria, atualizado_em)
    VALUES
      (${usuario_id}, ${nome_completo}, ${idade || null}, ${apelido}, ${condicao_fisica},
       ${doencas}, ${medicamentos}, ${limitacoes_fisicas}, ${limitacoes_cognitivas}, ${rotina_diaria}, NOW())
    ON CONFLICT (usuario_id) DO UPDATE SET
      nome_completo        = EXCLUDED.nome_completo,
      idade                = EXCLUDED.idade,
      apelido              = EXCLUDED.apelido,
      condicao_fisica      = EXCLUDED.condicao_fisica,
      doencas              = EXCLUDED.doencas,
      medicamentos         = EXCLUDED.medicamentos,
      limitacoes_fisicas   = EXCLUDED.limitacoes_fisicas,
      limitacoes_cognitivas= EXCLUDED.limitacoes_cognitivas,
      rotina_diaria        = EXCLUDED.rotina_diaria,
      atualizado_em        = NOW()
    RETURNING *`;
  return Response.json(row);
}
