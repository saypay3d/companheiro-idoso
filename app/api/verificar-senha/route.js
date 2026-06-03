export async function POST(req) {
  const { senha } = await req.json();
  const ok = senha === process.env.APP_SENHA;
  return Response.json({ ok });
}
