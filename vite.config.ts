import path from 'path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Dev-only stand-in for the Vercel function at /api/gemini.
 * Reads GEMINI_API_KEY from .env.local into the Node process. Never exposes it to the client.
 */
function geminiDevApi(): Plugin {
  return {
    name: 'gemini-dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url ?? '').split('?')[0];
        if (pathname !== '/api/gemini') {
          next();
          return;
        }
        void handleDevGemini(server, req, res);
      });
    },
  };
}

function applyServerEnv(server: ViteDevServer) {
  const loaded = loadEnv(server.config.mode, server.config.envDir, '');
  if (!process.env.GEMINI_API_KEY && loaded.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = loaded.GEMINI_API_KEY;
  }
  if (!process.env.GEMINI_MODEL && loaded.GEMINI_MODEL) {
    process.env.GEMINI_MODEL = loaded.GEMINI_MODEL;
  }
}

async function handleDevGemini(server: ViteDevServer, req: IncomingMessage, res: ServerResponse) {
  try {
    applyServerEnv(server);
    const mod = await server.ssrLoadModule('/api/gemini.ts') as {
      MAX_BODY_BYTES: number;
      runGemini: (body: unknown) => Promise<unknown>;
    };

    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed' });
      return;
    }

    const advertisedLength = Number(req.headers['content-length'] ?? 0);
    if (Number.isFinite(advertisedLength) && advertisedLength > mod.MAX_BODY_BYTES) {
      sendJson(res, 413, { error: '요청 본문이 너무 큽니다.' });
      req.resume();
      return;
    }

    const raw = await readBody(req, mod.MAX_BODY_BYTES);
    let body: unknown = {};
    if (raw.length > 0) {
      try {
        body = JSON.parse(raw.toString('utf8'));
      } catch {
        sendJson(res, 400, { error: 'JSON 본문이 올바르지 않습니다.' });
        return;
      }
    }

    const result = await mod.runGemini(body);
    sendJson(res, 200, result);
  } catch (error) {
    const status = typeof (error as { status?: unknown }).status === 'number'
      ? (error as { status: number }).status
      : 500;
    const message = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
    if (!res.headersSent) {
      sendJson(res, status, { error: message.replace(/AIza[0-9A-Za-z_-]+/g, '[redacted]') });
    }
  }
}

function readBody(req: IncomingMessage, limit: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let settled = false;

    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    req.on('data', (chunk: Buffer | string) => {
      if (settled) return;
      const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
      size += buf.length;
      if (size > limit) {
        const error = new Error('요청 본문이 너무 큽니다.') as Error & { status?: number };
        error.status = 413;
        fail(error);
        req.pause();
        return;
      }
      chunks.push(buf);
    });

    req.on('end', () => {
      if (settled) return;
      settled = true;
      resolve(Buffer.concat(chunks));
    });

    req.on('error', (error) => {
      fail(error);
    });
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react(), geminiDevApi()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  }
});
