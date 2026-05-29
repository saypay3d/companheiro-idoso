import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

const CAMPOS = [
  'filhos', 'netos', 'outros_familiares', 'nome_cuidador',
  'assuntos_gosta', 'assuntos_evitar', 'comidas_favoritas',
  'programas_tv', 'musicas', 'religiao', 'observacoes',
];

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuario_id = searchParams.get('usuario_id');
  const rows = await sql`
    SELECT campo, valor FROM perfil_completo WHERE usuario_id = ${usuario_id}`;
  const result = Object.fromEntries(CAMPOS.map(c => [c, '']));
  for (const r of rows) result[r.campo] = r.valor;
  return Response.json(result);
}

export async function POST(req) {
  const { usuario_id, ...campos } = await req.json();
  for (const [campo, valor] of Object.entries(campos)) {
    if (!CAMPOS.includes(campo)) continue;
    await sql`
      INSERT INTO perfil_completo (usuario_id, campo, valor, atualizado_em)
      VALUES (${usuario_id}, ${campo}, ${String(valor)}, NOW())
      ON CONFLICT (usuario_id, campo) DO UPDATE SET
        valor        = EXCLUDED.valor,
        atualizado_em = NOW()`;
  }
  return Response.json({ ok: true });
}
