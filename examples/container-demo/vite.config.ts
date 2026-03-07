import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"
import { gridlandWebPlugin } from "../../packages/web/src/vite-plugin"

/**
 * Vite plugin that proxies fetch requests from the container networking stack
 * to bypass browser CORS restrictions. The browser can't fetch cross-origin
 * resources without CORS headers, so we route through the dev server.
 */
function corsProxyPlugin(): Plugin {
  return {
    name: "cors-proxy",
    configureServer(server) {
      server.middlewares.use("/__proxy", async (req, res) => {
        const targetUrl = req.headers["x-proxy-url"] as string
        if (!targetUrl) {
          res.writeHead(400)
          res.end("Missing x-proxy-url header")
          return
        }

        try {
          // Forward the request method, headers, and body to the target
          const headers: Record<string, string> = {}
          for (const [key, value] of Object.entries(req.headers)) {
            if (
              key.startsWith("x-proxy-") ||
              key === "host" ||
              key === "origin" ||
              key === "referer" ||
              key === "connection"
            ) continue
            if (typeof value === "string") headers[key] = value
          }

          const body = await new Promise<Buffer>((resolve) => {
            const chunks: Buffer[] = []
            req.on("data", (chunk: Buffer) => chunks.push(chunk))
            req.on("end", () => resolve(Buffer.concat(chunks)))
          })

          const response = await fetch(targetUrl, {
            method: req.method || "GET",
            headers,
            body: body.length > 0 && req.method !== "GET" && req.method !== "HEAD" ? body : undefined,
            redirect: "follow",
          })

          // Forward response status and headers back
          const respHeaders: Record<string, string> = {}
          for (const [key, value] of response.headers.entries()) {
            // Skip headers that node http won't let us set
            if (key === "transfer-encoding" || key === "connection") continue
            respHeaders[key] = value
          }
          res.writeHead(response.status, response.statusText, respHeaders)

          if (response.body) {
            const reader = response.body.getReader()
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              res.write(value)
            }
          }
          res.end()
        } catch (err: any) {
          console.error("[cors-proxy]", targetUrl, err.message)
          res.writeHead(502)
          res.end(err.message)
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [
    ...gridlandWebPlugin(),
    react(),
    corsProxyPlugin(),
  ],
  build: {
    target: "esnext",
  },
  esbuild: {
    target: "esnext",
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
    },
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "credentialless",
    },
  },
  preview: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "credentialless",
    },
  },
})
