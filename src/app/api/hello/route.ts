export async function POST(request: Request) {
  const req = await request.json();
  const response = { text: `Hello, ${req.name}!` };
  return Response.json(response);
}
