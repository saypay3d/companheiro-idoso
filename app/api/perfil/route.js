import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

const CAMPOS_EXTRA = [
  'filhos', 'netos', 'outros_familiares', 'nome_cuidador',
  'assuntos_gosta', 'assuntos_evitar', 'comidas_favoritas',
  'programas_tv', 'musicas', 'religiao', 'observacoes',
];

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuario_id = searchParams.get('usuario_id');

  const [rows] = await Promise.all([
    sql`SELECT * FROM perfil_cuidador WHERE usuario_id = ${usuario_id}`,
  ]);

  let perfilCompleto = [];
  try {
    perfilCompleto = await sql`
      SELECT campo, valor FROM perfil_completo
      WHERE usuario_id = ${usuario_id} AND valor != ''`;
  } catch (e) {
    console.warn('[perfil GET] perfil_completo indisponível:', e.message);
  }

  const base  = rows[0] ?? {};
  const extra = Object.fromEntries(perfilCompleto.map(p => [p.campo, p.valor]));
  return Response.json({ ...base, ...extra });
}

export async function POST(req) {
  const body = await req.json();
  const {
    usuario_id, nome_completo, idade, apelido, condicao_fisica,
    doencas, medicamentos, limitacoes_fisicas, limitacoes_cognitivas, rotina_diaria,
  } = body;

  // Salva campos principais em perfil_cuidador
  await sql`
    INSERT INTO perfil_cuidador
      (usuario_id, nome_completo, idade, apelido, condicao_fisica,
       doencas, medicamentos, limitacoes_fisicas, limitacoes_cognitivas, rotina_diaria, atualizado_em)
    VALUES
      (${usuario_id}, ${nome_completo}, ${idade || null}, ${apelido}, ${condicao_fisica},
       ${doencas}, ${medicamentos}, ${limitacoes_fisicas}, ${limitacoes_cognitivas}, ${rotina_diaria}, NOW())
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
      atualizado_em         = NOW()`;

  // Salva campos extras em perfil_completo (ignora se tabela não existir)
  try {
    for (const campo of CAMPOS_EXTRA) {
      if (!(campo in body)) continue;
      const valor = String(body[campo] ?? '');
      await sql`
        INSERT INTO perfil_completo (usuario_id, campo, valor, atualizado_em)
        VALUES (${usuario_id}, ${campo}, ${valor}, NOW())
        ON CONFLICT (usuario_id, campo) DO UPDATE SET
          valor         = EXCLUDED.valor,
          atualizado_em = NOW()`;
    }
  } catch (e) {
    console.warn('[perfil POST] perfil_completo indisponível:', e.message);
  }

  return Response.json({ ok: true });
}
