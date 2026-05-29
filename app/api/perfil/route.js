import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuario_id = searchParams.get('usuario_id');
  const rows = await sql`SELECT * FROM perfil_cuidador WHERE usuario_id = ${usuario_id}`;
  return Response.json(rows[0] ?? {});
}

export async function POST(req) {
  const body = await req.json();
  const {
    usuario_id, nome_completo, idade, apelido, condicao_fisica,
    doencas, medicamentos, limitacoes_fisicas, limitacoes_cognitivas, rotina_diaria,
    nomes_filhos, nomes_netos, outros_familiares, nome_cuidador,
    assuntos_gosta, assuntos_evitar, comidas_favoritas,
    programas_tv, musicas, religiao, observacoes,
  } = body;

  await sql`
    INSERT INTO perfil_cuidador (
      usuario_id, nome_completo, idade, apelido, condicao_fisica,
      doencas, medicamentos, limitacoes_fisicas, limitacoes_cognitivas, rotina_diaria,
      nomes_filhos, nomes_netos, outros_familiares, nome_cuidador,
      assuntos_gosta, assuntos_evitar, comidas_favoritas,
      programas_tv, musicas, religiao, observacoes, atualizado_em
    ) VALUES (
      ${usuario_id}, ${nome_completo}, ${idade || null}, ${apelido}, ${condicao_fisica},
      ${doencas}, ${medicamentos}, ${limitacoes_fisicas}, ${limitacoes_cognitivas}, ${rotina_diaria},
      ${nomes_filhos}, ${nomes_netos}, ${outros_familiares}, ${nome_cuidador},
      ${assuntos_gosta}, ${assuntos_evitar}, ${comidas_favoritas},
      ${programas_tv}, ${musicas}, ${religiao}, ${observacoes}, NOW()
    )
    ON CONFLICT (usuario_id) DO UPDATE SET
      nome_completo         = EXCLUDED.nome_completo,
      idade                 = EXCLUDED.idade,
      apelido               = EXCLUDED.apelido,
      condicao_fisica       = EXCLUDED.condicao_fisica,
      doencas               = EXCLUDED.doencas,
      medicamentos          = EXCLUDED.medicamentos,
      limitacoes_fisicas    = EXCLUDED.limitacoes_fisicas,
      limitacoes_cognitivas = EXCLUDED.limitacoes_cognitivas,
      rotina_diaria         = EXCLUDED.rotina_diaria,
      nomes_filhos          = EXCLUDED.nomes_filhos,
      nomes_netos           = EXCLUDED.nomes_netos,
      outros_familiares     = EXCLUDED.outros_familiares,
      nome_cuidador         = EXCLUDED.nome_cuidador,
      assuntos_gosta        = EXCLUDED.assuntos_gosta,
      assuntos_evitar       = EXCLUDED.assuntos_evitar,
      comidas_favoritas     = EXCLUDED.comidas_favoritas,
      programas_tv          = EXCLUDED.programas_tv,
      musicas               = EXCLUDED.musicas,
      religiao              = EXCLUDED.religiao,
      observacoes           = EXCLUDED.observacoes,
      atualizado_em         = NOW()`;

  return Response.json({ ok: true });
}
