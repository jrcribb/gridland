import { useEffect, useRef, useState, type RefObject } from "react"
import { Terminal } from "@xterm/headless"
import { useXtermBuffer } from "./use-xterm-buffer"
import { keyEventToSequence } from "./keyboard-handler"
import { startNetworkStack } from "./network/stack"
import type { BrowserRenderer } from "../../../packages/web/src/browser-renderer"

type Status = "loading" | "booting" | "ready" | "error"

interface ContainerTerminalProps {
  rendererRef: RefObject<BrowserRenderer | null>
}

export function ContainerTerminal({ rendererRef }: ContainerTerminalProps) {
  const [status, setStatus] = useState<Status>("loading")
  const [errorMsg, setErrorMsg] = useState("")
  const terminalRef = useRef<Terminal | null>(null)
  const inputBufferRef = useRef<number[]>([])

  // Initialize headless terminal
  useEffect(() => {
    const terminal = new Terminal({
      cols: 80,
      rows: 24,
      scrollback: 1000,
      allowProposedApi: true,
    })
    terminalRef.current = terminal

    return () => {
      terminal.dispose()
      terminalRef.current = null
    }
  }, [])

  // Load the container WASM and hook up TTY
  useEffect(() => {
    const terminal = terminalRef.current
    if (!terminal) return

    setStatus("booting")

    loadContainer(terminal, inputBufferRef.current).catch((err) => {
      console.error("Failed to load container:", err)
      setErrorMsg(err.message || String(err))
      setStatus("error")
    })

    // Watch for first output to detect boot progress
    let gotOutput = false
    const checkReady = setInterval(() => {
      const line = terminal.buffer.active.getLine(0)
      if (line) {
        const text = line.translateToString(true)
        if (text.trim().length > 0 && !gotOutput) {
          gotOutput = true
          setStatus("ready")
        }
      }
    }, 500)

    return () => clearInterval(checkReady)
  }, [])

  // Keyboard capture on the gridland canvas
  useEffect(() => {
    const renderer = rendererRef.current
    if (!renderer) return

    const canvas = renderer.canvas

    const onKeyDown = (e: KeyboardEvent) => {
      const seq = keyEventToSequence(e)
      if (seq !== null) {
        e.preventDefault()
        e.stopPropagation()
        for (let i = 0; i < seq.length; i++) {
          inputBufferRef.current.push(seq.charCodeAt(i))
        }
      }
    }

    canvas.addEventListener("keydown", onKeyDown, true)
    return () => canvas.removeEventListener("keydown", onKeyDown, true)
  }, [rendererRef])

  // Handle terminal resize when gridland container resizes
  useEffect(() => {
    const renderer = rendererRef.current
    const terminal = terminalRef.current
    if (!renderer || !terminal) return

    const canvas = renderer.canvas
    const container = canvas.parentElement
    if (!container) return

    const observer = new ResizeObserver(() => {
      const cellSize = renderer.painter.getCellSize()
      if (cellSize.width <= 0 || cellSize.height <= 0) return

      const rect = container.getBoundingClientRect()
      const newCols = Math.max(1, Math.floor(rect.width / cellSize.width))
      const newRows = Math.max(1, Math.floor(rect.height / cellSize.height))

      if (newCols !== terminal.cols || newRows !== terminal.rows) {
        terminal.resize(newCols, newRows)
      }
    })
    observer.observe(container)

    return () => observer.disconnect()
  }, [rendererRef])

  const rows = useXtermBuffer(terminalRef.current)

  if (status === "error") {
    return (
      <box width="100%" height="100%" justifyContent="center" alignItems="center" flexDirection="column">
        <text fg="#f38ba8">Failed to load container</text>
        <text fg="#a6adc8">{errorMsg}</text>
        <text fg="#585b70" marginTop={1}>
          Run `bun run build-container` first to build the WASM image.
        </text>
      </box>
    )
  }

  if (status === "loading" || status === "booting") {
    return (
      <box width="100%" height="100%" justifyContent="center" alignItems="center" flexDirection="column">
        <text fg="#89b4fa">
          {status === "loading" ? "Loading WASM module..." : "Booting Linux... (this takes 10-30s)"}
        </text>
        <text fg="#585b70" marginTop={1}>riscv64/alpine:3.20 via container2wasm</text>
      </box>
    )
  }

  return (
    <box width="100%" height="100%" flexDirection="column">
      {rows.map((row, y) => (
        <text key={y}>
          {row.spans.map((span, i) => (
            <span
              key={i}
              fg={span.fg ?? "#cdd6f4"}
              bg={span.bg}
              attributes={span.attributes || undefined}
            >
              {span.text}
            </span>
          ))}
        </text>
      ))}
    </box>
  )
}

function genmac(): string {
  return "02:XX:XX:XX:XX:XX".replace(/X/g, () => {
    return "0123456789ABCDEF".charAt(Math.floor(Math.random() * 16))
  })
}

/**
 * Loads the c2w emscripten module and hooks its stdio into the headless xterm terminal.
 *
 * The c2w TinyEMU build uses emscripten's FS with TTY devices.
 * We use Module.stdin/stdout/stderr callbacks to intercept I/O:
 * - stdin: reads from an input buffer filled by keyboard events
 * - stdout/stderr: writes raw bytes to terminal.write() for ANSI parsing
 */
async function loadContainer(terminal: Terminal, inputBuffer: number[]): Promise<void> {
  // Batch output bytes and flush to terminal
  let outputBuffer: number[] = []
  let flushScheduled = false

  function flushOutput() {
    if (outputBuffer.length > 0) {
      const data = new Uint8Array(outputBuffer)
      outputBuffer = []
      terminal.write(data)
    }
    flushScheduled = false
  }

  function scheduleFlush() {
    if (!flushScheduled) {
      flushScheduled = true
      setTimeout(flushOutput, 0)
    }
  }

  // Start network stack and wait for TLS certificate before booting container.
  // Use a timeout so the container boots even if networking setup hangs.
  const wasmImageUrl = location.origin + "/c2w/c2w-net-proxy.wasm.gzip"
  let cert: Uint8Array | null = null
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Network stack timed out after 30s")), 30000),
    )
    cert = await Promise.race([startNetworkStack(wasmImageUrl), timeout])
    // cert received successfully
  } catch (err) {
    console.warn("[container] Network stack failed, booting without networking:", err)
  }

  // TinyEMU's c2w fork handles /pack/info internally via FSVirtFile.
  // We pass -net socket to create the virtio-net device and -mac for the MAC address.
  // TinyEMU writes n: and t: lines to the info file automatically.
  const moduleArgs: string[] = []
  if (cert) {
    moduleArgs.push("-net", "socket", "-mac", genmac())
  }

  // Set up Module global before loading the script.
  //
  // Important: Do NOT set Module.stdin. When Module.stdin is set, emscripten
  // creates a simple character device (not a TTY) for /dev/stdin. That device's
  // read() returns 0 bytes (EOF) when our callback returns null, causing TinyEMU
  // to exit immediately.
  //
  // Instead, we leave stdin unset so emscripten creates a default TTY device
  // (symlinked /dev/stdin -> /dev/tty). We then patch the TTY's get_char in
  // preRun to feed from our inputBuffer, using Asyncify.handleSleep to block
  // until data is available (instead of returning EOF).
  //
  // We DO set Module.stdout/stderr to capture byte-level output from TinyEMU.
  const Module: any = {
    noInitialRun: false,
    arguments: moduleArgs,
    websocket: cert ? { url: "http://localhost:9999/" } : undefined,
    stdout: (charCode: number) => {
      outputBuffer.push(charCode)
      scheduleFlush()
    },
    stderr: (charCode: number) => {
      outputBuffer.push(charCode)
      scheduleFlush()
    },
    print: (text: string) => {
      terminal.write(text + "\r\n")
    },
    printErr: (text: string) => {
      console.warn("[container]", text)
    },
    locateFile: (path: string) => {
      return "/c2w/" + path
    },
    preRun: [
      // Write cert file to emscripten FS root (served via wasi0 9p mount)
      function (mod: any) {
        if (cert) {
          const FS = mod.FS
          try { FS.mkdir("/.wasmenv") } catch (_e) { /* may exist */ }
          FS.writeFile("/.wasmenv/proxy.crt", cert)
        }
      },
    ],
  }

  ;(window as any).Module = Module

  // Suppress window.prompt — the default TTY get_char falls back to it,
  // which would show a blocking dialog. Our patched get_char handles stdin
  // via Asyncify instead.
  window.prompt = () => null

  // Load out.js as a script. It runs synchronously, pushes runWithFS to
  // Module.preRun (after our cert write), and calls run().
  // preRun() processes all callbacks: our cert write runs first, then
  // runWithFS starts the data file download and adds a run dependency.
  // run() returns early. When data files finish loading, run() resumes.
  await loadScript("/c2w/out.js")

  // Push TTY patch after out.js loads — it runs when run() resumes
  // after data files finish loading.
  Module.preRun.push(function (mod: any) {
    const TTY = mod.TTY
    if (!TTY) {
      console.warn("[container] TTY not available in preRun")
      return
    }

    TTY.default_tty_ops.get_char = function (tty: any) {
      if (tty.input && tty.input.length) {
        return tty.input.shift()
      }
      if (inputBuffer.length > 0) {
        return inputBuffer.shift()!
      }
      return undefined
    }
  })

  // TinyEMU's emscripten build doesn't write env:/m: lines to the FSVirtFile
  // (those are WASI-only). DNS also doesn't work because the browser can't
  // forward raw UDP queries. Detect the shell prompt and inject proxy config
  // so programs use the HTTP proxy (which resolves DNS via browser fetch()).
  if (cert) {
    injectProxySetup(terminal, inputBuffer)
  }
}

/**
 * Watch terminal output for the shell prompt, then inject proxy environment
 * setup commands. The proxy at 192.168.127.253:80 handles DNS resolution
 * via browser fetch(), so all HTTP/HTTPS must go through it.
 */
function injectProxySetup(terminal: Terminal, inputBuffer: number[]) {
  let injected = false
  const check = setInterval(() => {
    if (injected) return
    // Look for shell prompt (e.g. "/ #" or "~ #") on the cursor line
    const cursorY = terminal.buffer.active.cursorY
    const line = terminal.buffer.active.getLine(cursorY)
    if (!line) return
    const text = line.translateToString(true)
    if (text.match(/[/#~]\s*#\s*$/)) {
      injected = true
      clearInterval(check)
      // Inject proxy env vars as a single command, then clear screen
      const cmd = [
        "export http_proxy=http://192.168.127.253:80",
        "export https_proxy=http://192.168.127.253:80",
        "export HTTP_PROXY=http://192.168.127.253:80",
        "export HTTPS_PROXY=http://192.168.127.253:80",
        "export SSL_CERT_FILE=/mnt/wasi0/.wasmenv/proxy.crt",
        "clear",
      ].join(" && ")
      pushInput(inputBuffer, cmd + "\n")
    }
  }, 500)
}

function pushInput(inputBuffer: number[], text: string) {
  for (let i = 0; i < text.length; i++) {
    inputBuffer.push(text.charCodeAt(i))
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
    document.head.appendChild(script)
  })
}
