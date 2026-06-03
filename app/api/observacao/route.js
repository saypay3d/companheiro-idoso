export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function garantirTabela() {
  await sql`
    CREATE TABLE IF NOT EXISTS observacoes (
      id            SERIAL PRIMARY KEY,
      usuario_id    INT REFERENCES usuarios(id),
      solicitado_em TIMESTAMP DEFAULT NOW(),
      video         TEXT,
      respondido    BOOLEAN DEFAULT false
    )`;
}

export async function POST(req) {
  try {
    await garantirTabela();
    const { usuario_id } = await req.json();
    const result = await sql`
      INSERT INTO observacoes (usuario_id)
      VALUES (${usuario_id})
      RETURNING id, solicitado_em`;
    return Response.json(result[0]);
  } catch (e) {
    console.error('[observacao POST] erro:', e.message, e.stack);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await garantirTabela();
    const { searchParams } = new URL(req.url);
    const id         = searchParams.get('id');
    const usuario_id = searchParams.get('usuario_id');

    if (id) {
      const rows = await sql`
        SELECT id, video, respondido, solicitado_em
        FROM observacoes WHERE id = ${id} LIMIT 1`;
      return Response.json(rows[0] ?? null);
    }

    const rows = await sql`
      SELECT id FROM observacoes
      WHERE usuario_id = ${usuario_id} AND respondido = false
      ORDER BY solicitado_em DESC LIMIT 1`;
    return Response.json(rows[0] ?? null);
  } catch (e) {
    console.error('[observacao GET] erro:', e.message, e.stack);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    await garantirTabela();
    const { id, video } = await req.json();
    const tamanhoKB = Math.round((video?.length ?? 0) / 1024);
    console.log('[observacao PATCH] id:', id, '| tamanho:', tamanhoKB, 'KB');
    await sql`
      UPDATE observacoes
      SET video = ${video}, respondido = true
      WHERE id = ${id}`;
    return Response.json({ ok: true });
  } catch (e) {
    console.error('[observacao PATCH] erro:', e.message, e.stack);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
