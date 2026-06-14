import { useState, useCallback, useEffect } from 'react'
import { Chess } from 'chess.js'
import type { Square } from 'chess.js'
import { getBotMove } from '../engine/bot'
import type { BotConfig } from '../engine/bot'
import type { PieceDropHandlerArgs } from 'react-chessboard'

function getStatus(game: Chess, playerColor: 'w' | 'b'): string {
  if (game.isCheckmate()) return game.turn() === 'w' ? 'Black wins by checkmate!' : 'White wins by checkmate!'
  if (game.isStalemate()) return 'Draw by stalemate!'
  if (game.isDraw()) return 'Draw!'
  if (game.isCheck()) return game.turn() === 'w' ? 'White is in check!' : 'Black is in check!'
  return game.turn() === playerColor ? 'Your turn' : 'Bot is thinking...'
}

function isPawnPromotion(game: Chess, from: string, to: string): boolean {
  const piece = game.get(from as Square)
  if (!piece || piece.type !== 'p') return false
  const toRank = to[1]
  return (piece.color === 'w' && toRank === '8') || (piece.color === 'b' && toRank === '1')
}

function cloneGame(game: Chess, initialFen?: string): Chess {
  const clone = new Chess(initialFen)
  game.history({ verbose: true }).forEach(m => clone.move(m))
  return clone
}

export type PromotionPiece = 'q' | 'r' | 'b' | 'n'

export interface PendingPromotion {
  from: string
  to: string
}

type AnalyzeFn = (fen: string, moveSan: string, moveNumber: number, color: 'w' | 'b') => void

export function useChessGame(botConfig: BotConfig, onMoveAnalyze?: AnalyzeFn) {
  const [game, setGame] = useState(() => new Chess(botConfig.initialFen))
  const [displayFen, setDisplayFen] = useState<string | null>(null)
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null)

  useEffect(() => {
    setGame(new Chess(botConfig.initialFen))
    setPendingPromotion(null)
    setDisplayFen(null)
  }, [botConfig.initialFen])

  function triggerAnalysis(newGame: Chess) {
    const history = newGame.history({ verbose: true })
    if (history.length === 0) return
    const lastMove = history[history.length - 1]
    const moveNumber = Math.ceil(history.length / 2)
    onMoveAnalyze?.(newGame.fen(), lastMove.san, moveNumber, lastMove.color)
  }

  const onPieceDrop = useCallback(({ sourceSquare, targetSquare }: PieceDropHandlerArgs): boolean => {
    if (!targetSquare) return false
    if (game.turn() !== botConfig.playerColor) return false
    if (game.isGameOver()) return false

    try {
      const newGame = cloneGame(game, botConfig.initialFen)
      if (!newGame.move({ from: sourceSquare, to: targetSquare, promotion: 'q' })) return false

      if (isPawnPromotion(game, sourceSquare, targetSquare)) {
        setPendingPromotion({ from: sourceSquare, to: targetSquare })
        const fenParts = newGame.fen().split(' ')
        const pawnColor = game.turn() === 'w' ? 'P' : 'p'
        const queenChar = game.turn() === 'w' ? 'Q' : 'q'
        fenParts[0] = fenParts[0].replace(queenChar, pawnColor)
        setDisplayFen(fenParts.join(' '))
        return true
      }

      triggerAnalysis(newGame)
      setGame(newGame)
      return true
    } catch {
      return false
    }
  }, [game, botConfig.playerColor, onMoveAnalyze])

  const confirmPromotion = useCallback((piece: PromotionPiece) => {
    if (!pendingPromotion) return
    const newGame = cloneGame(game, botConfig.initialFen)
    newGame.move({ from: pendingPromotion.from, to: pendingPromotion.to, promotion: piece })
    triggerAnalysis(newGame)
    setGame(newGame)
    setDisplayFen(null)
    setPendingPromotion(null)
  }, [pendingPromotion, game, onMoveAnalyze])

  const cancelPromotion = useCallback(() => {
    setDisplayFen(null)
    setPendingPromotion(null)
  }, [])

  useEffect(() => {
    if (game.turn() === botConfig.playerColor) return
    if (game.isGameOver()) return
    if (pendingPromotion) return

    const timeout = setTimeout(() => {
      const move = getBotMove(game, botConfig)
      if (!move) return
      const newGame = cloneGame(game, botConfig.initialFen)
      newGame.move(move)
      triggerAnalysis(newGame)
      setGame(newGame)
    }, 300)

    return () => clearTimeout(timeout)
  }, [game, botConfig, pendingPromotion])

  const resetGame = useCallback(() => {
    setGame(new Chess(botConfig.initialFen))
    setPendingPromotion(null)
    setDisplayFen(null)
  }, [botConfig.initialFen])

  return {
    fen: displayFen ?? game.fen(),
    pgn: game.pgn(),
    onPieceDrop,
    isGameOver: game.isGameOver(),
    status: getStatus(game, botConfig.playerColor),
    history: game.history(),
    resetGame,
    pendingPromotion,
    confirmPromotion,
    cancelPromotion,
  }
}