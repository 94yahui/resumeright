import https from 'node:https'

// DeepSeek's cert chain may not be trusted in some environments (e.g. Docker, certain macOS setups).
// Use a dedicated agent that skips verification only for AI API calls.
const agent = new https.Agent({ rejectUnauthorized: false })

export async function aiFetch(url: string, init: RequestInit): Promise<Response> {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const body = init.body ? Buffer.from(init.body as string) : undefined
    const req = https.request(
      {
        hostname: u.hostname,
        port: u.port || 443,
        path: u.pathname + u.search,
        method: (init.method ?? 'GET').toUpperCase(),
        headers: {
          'Accept-Encoding': 'identity',
          ...(init.headers as Record<string, string>),
          ...(body ? { 'Content-Length': String(body.byteLength) } : {}),
        },
        agent,
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (c: Buffer) => chunks.push(c))
        res.on('end', () => {
          const buf = Buffer.concat(chunks)
          resolve(new Response(buf, { status: res.statusCode ?? 200, headers: res.headers as Record<string, string> }))
        })
        res.on('error', reject)
      }
    )
    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}
