const UPSTREAM = "https://api.wisprflow.ai";
const PORT = 61990;

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // Intercept command mode routing
    if (req.method === "POST" && url.pathname === "/llm/command_mode_route") {
      const body = await req.json() as {
        full_text: string;
        selected_text: string;
        instruction: string;
      };

      const timestamp = new Date().toISOString();
      console.log(`\n[${timestamp}] COMMAND MODE`);
      console.log(`  instruction: ${body.instruction}`);
      if (body.selected_text) {
        console.log(`  selected_text: ${body.selected_text}`);
      }
      if (body.full_text && body.full_text !== body.selected_text) {
        console.log(`  full_text: ${body.full_text.slice(0, 200)}`);
      }

      return Response.json({ name: "draft_text", arguments: "" });
    }

    // Forward everything else to the real API
    const upstream = `${UPSTREAM}${url.pathname}${url.search}`;
    const headers = new Headers(req.headers);
    headers.delete("host");

    const res = await fetch(upstream, {
      method: req.method,
      headers,
      body: req.body,
      // @ts-ignore - Bun supports duplex
      duplex: "half",
    });

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
    });
  },
});

console.log(`wispr-proxy listening on http://localhost:${server.port}`);
console.log(`forwarding to ${UPSTREAM}`);
console.log(`intercepting POST /llm/command_mode_route\n`);
console.log(`launch wispr with:`);
console.log(`  BASE_WEB_URL=http://localhost:${PORT} /Applications/Wispr\\ Flow.app/Contents/MacOS/Wispr\\ Flow\n`);
