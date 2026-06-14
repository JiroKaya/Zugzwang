import { useEffect, useRef, useState, useCallback } from 'react'
import { cpToWinPercent, estimateElo, moveAccuracy } from '../engine/analysis'
import type { PositionEval, GameAnalysis, MoveClassification } from '../engine/analysis'

function parseScore(line: string): { cp: number, mate: number | null } | null {
  const cpMatch = line.match(/score cp (-?\d+)/)
  if (cpMatch) return { cp: parseInt(cpMatch[1]), mate: null }
  const mateMatch = line.match(/score mate (-?\d+)/)
  if (mateMatch) {
    const m = parseInt(mateMatch[1])
    return { cp: m > 0 ? 1000 : -1000, mate: m }
  }
  return null
}

function parseBestMove(line: string): string | null {
  const match = line.match(/^bestmove (\S+)/)
  return match ? match[1] : null
}

function classify(absoluteLoss: number): MoveClassification {
  if (absoluteLoss <= 0) return 'best'
  if (absoluteLoss < 20) return 'excellent'
  if (absoluteLoss < 50) return 'good'
  if (absoluteLoss < 90) return 'inaccuracy'
  if (absoluteLoss < 150) return 'mistake'
  return 'blunder'
}

interface QueueItem {
  fen: string
  moveSan: string
  moveNumber: number
  color: 'w' | 'b'
}

export function useAnalysis() {
  const workerRef = useRef<Worker | null>(null)
  const isReadyRef = useRef(false)

  const queueRef = useRef<QueueItem[]>([])
  const queueIndexRef = useRef(0)
  const resultsRef = useRef<PositionEval[]>([])
  const currentMateRef = useRef<number | null>(null)
  const currentCpRef = useRef<number | null>(null)
  const prevAbsCpRef = useRef(0) // eval before current move, white's perspective
  const runningRef = useRef(false)

  const [positions, setPositions] = useState<PositionEval[]>([])
  const [analysis, setAnalysis] = useState<GameAnalysis | null>(null)
  const [isReady, setIsReady] = useState(false)

  // Build the final analysis once, from a complete positions array
  const finalize = useCallback((all: PositionEval[]) => {
    let whiteLoss = 0, blackLoss = 0, whiteN = 0, blackN = 0
    const whiteAccs: number[] = []
    const blackAccs: number[] = []

    const scored = all.map((pos, i) => {
      const before = i === 0 ? 0 : all[i - 1].centipawns
      const b = Math.max(-1000, Math.min(1000, before))
      const a = Math.max(-1000, Math.min(1000, pos.centipawns))

      // --- ACPL (rating) path, unchanged ---
      let loss = pos.color === 'w' ? b - a : a - b
      loss = Math.max(0, loss)
      const decided = Math.abs(b) > 600
      const contrib = decided ? 0 : Math.min(loss, 300)
      if (pos.color === 'w') { whiteLoss += contrib; whiteN++ }
      else { blackLoss += contrib; blackN++ }

      // --- accuracy path, win% based ---
      // win% is always white's perspective; for the mover, "loss" is their own drop
      const winBefore = cpToWinPercent(b)
      const winAfter = cpToWinPercent(a)
      if (pos.color === 'w') {
        whiteAccs.push(moveAccuracy(winBefore, winAfter))
      } else {
        // black's win% = 100 - white's win%
        blackAccs.push(moveAccuracy(100 - winBefore, 100 - winAfter))
      }

      return { ...pos, loss, classification: classify(loss) }
    })

    const whiteAcpl = whiteN ? whiteLoss / whiteN : 0
    const blackAcpl = blackN ? blackLoss / blackN : 0
    const avg = (xs: number[]) => xs.length ? Math.round(xs.reduce((s, x) => s + x, 0) / xs.length) : 100

    setAnalysis({
      positions: scored,
      whiteElo: estimateElo(whiteAcpl),
      blackElo: estimateElo(blackAcpl),
      whiteAccuracy: avg(whiteAccs),
      blackAccuracy: avg(blackAccs),
    })
    setPositions(scored)
  }, [])

  const processNext = useCallback(() => {
    const worker = workerRef.current
    if (!worker) return

    if (queueIndexRef.current >= queueRef.current.length) {
      runningRef.current = false
      finalize([...resultsRef.current])   // finalize sets both analysis AND positions
      return
    }

    const item = queueRef.current[queueIndexRef.current]
    currentCpRef.current = null
    worker.postMessage('ucinewgame')
    worker.postMessage(`position fen ${item.fen}`)
    worker.postMessage('go depth 12')
  }, [finalize])

  useEffect(() => {
    const worker = new Worker('/stockfish.js')
    workerRef.current = worker

    worker.onmessage = (e) => {
      const line: string = typeof e.data === 'string' ? e.data : ''

      if (line.includes('uciok')) { worker.postMessage('isready'); return }
      if (line.includes('readyok')) { isReadyRef.current = true; setIsReady(true); return }

      const score = parseScore(line)
      if (score !== null) {
        currentCpRef.current = score.cp
        currentMateRef.current = score.mate
      }

      const best = parseBestMove(line)
      if (!best || !runningRef.current) return

      const item = queueRef.current[queueIndexRef.current]
      if (!item) return

      const rawCp = currentCpRef.current ?? 0
      const rawMate = currentMateRef.current
      const sideToMove = item.fen.split(' ')[1] as 'w' | 'b'
      const whiteCp = sideToMove === 'w' ? rawCp : -rawCp
      const whiteMate = rawMate === null ? undefined : (sideToMove === 'w' ? rawMate : -rawMate)

      resultsRef.current.push({
        fen: item.fen,
        moveNumber: item.moveNumber,
        moveSan: item.moveSan,
        color: item.color,
        centipawns: whiteCp,
        bestMove: best,
        classification: 'good',
        loss: 0,
        mateIn: whiteMate,
      })

      currentMateRef.current = null
      queueIndexRef.current++
      processNext()
    }

    worker.postMessage('uci')
    return () => worker.terminate()
  }, [])

  const startQueue = useCallback((items: QueueItem[]) => {
    if (!isReadyRef.current) return
    if (runningRef.current) return   // already analyzing, ignore re-entry
    queueRef.current = items
    queueIndexRef.current = 0
    resultsRef.current = []
    prevAbsCpRef.current = 0
    runningRef.current = true
    processNext()
  }, [processNext])

  // Live game: analyze a single new move by re-running the whole game so
  // perspective/prev-eval stay consistent. moves = full move list so far.
  const analyzeGame = useCallback((items: QueueItem[]) => {
    startQueue(items)
  }, [startQueue])

  const reset = useCallback(() => {
    queueRef.current = []
    queueIndexRef.current = 0
    resultsRef.current = []
    prevAbsCpRef.current = 0
    currentCpRef.current = null
    runningRef.current = false
    setPositions([])
    setAnalysis(null)
  }, [])

  return { analyzeGame, analysis, positions, isReady, reset }
}