/// <reference lib="webworker" />

self.importScripts('/stockfish.js')

declare const Stockfish: () => Promise<{ addMessageListener: (cb: (line: string) => void) => void, postMessage: (cmd: string) => void }>

let engine: Awaited<ReturnType<typeof Stockfish>> | null = null

async function init() {
  engine = await Stockfish()
  engine.addMessageListener((line) => {
    self.postMessage({ type: 'message', line })
  })
  engine.postMessage('uci')
}

self.onmessage = async (e) => {
  const { type, payload } = e.data

  if (type === 'init') {
    await init()
    return
  }

  if (!engine) return

  if (type === 'evaluate') {
    const { fen, depth } = payload
    engine.postMessage('ucinewgame')
    engine.postMessage(`position fen ${fen}`)
    engine.postMessage(`go depth ${depth ?? 15}`)
  }

  if (type === 'stop') {
    engine.postMessage('stop')
  }
}