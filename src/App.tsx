import { useEffect, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Sidebar } from "./components/Sidebar";
import { ColorPicker } from "./components/ColorPicker";
import { PromotionPicker } from "./components/PromotionPicker";
import { AnalyzeModal } from "./components/AnalyzeModal";
import { EvalBar } from "./components/EvalBar";
import { useChessGame } from "./hooks/useChessGame";
import { useAnalysis } from "./hooks/useAnalysis";
import { DEFAULT_WEIGHTS } from "./engine/personalities";
import type { PersonalityWeights } from "./engine/personalities";
import { Chess } from "chess.js";

export default function App() {
  const [levelIndex, setLevelIndex] = useState(1);
  const [weights, setWeights] = useState<PersonalityWeights>(DEFAULT_WEIGHTS);
  const [playerColor, setPlayerColor] = useState<"w" | "b" | null>(null);
  const [analysisMode, setAnalysisMode] = useState(false);
  const [analysisIndex, setAnalysisIndex] = useState(0);
  const [showAnalyzeModal, setShowAnalyzeModal] = useState(false);
  const [initialFen, setInitialFen] = useState<string | undefined>(undefined);
  const [isPgnAnalysis, setIsPgnAnalysis] = useState(false);
  const [boardFlipped, setBoardFlipped] = useState(false);

  const { analyzeGame, analysis, reset: resetAnalysis } = useAnalysis();

  const {
    fen,
    pgn,
    onPieceDrop,
    status,
    history,
    resetGame,
    pendingPromotion,
    confirmPromotion,
    cancelPromotion,
    isGameOver,
  } = useChessGame({
    levelIndex,
    weights,
    playerColor: playerColor ?? "w",
    initialFen,
  });

  function handleColorSelect(color: "w" | "b" | "random") {
    setPlayerColor(
      color === "random" ? (Math.random() > 0.5 ? "w" : "b") : color,
    );
  }

  function handleNewGame() {
    setPlayerColor(null);
    setInitialFen(undefined);
    resetGame();
    resetAnalysis();
    setAnalysisMode(false);
    setAnalysisIndex(0);
    setIsPgnAnalysis(false);
  }

  function handleLevelChange(index: number) {
    setLevelIndex(index);
    handleNewGame();
  }

  function handlePresetChange(newWeights: PersonalityWeights) {
    setWeights(newWeights);
    handleNewGame();
  }

  function handleAnalyzePgn(
    items: {
      fen: string;
      moveSan: string;
      moveNumber: number;
      color: "w" | "b";
    }[],
  ) {
    resetAnalysis();
    setAnalysisIndex(0);
    setShowAnalyzeModal(false);
    setIsPgnAnalysis(true);
    setPlayerColor("w");
    analyzeGame(items);
  }

  function handleAnalyze() {
    const replay = new Chess();
    const items = history.map((san, i) => {
      replay.move(san);
      return {
        fen: replay.fen(),
        moveSan: san,
        moveNumber: Math.ceil((i + 1) / 2),
        color: (i % 2 === 0 ? "w" : "b") as "w" | "b",
      };
    });
    resetAnalysis();
    analyzeGame(items);
    setIsPgnAnalysis(true);
  }

  useEffect(() => {
    if (isPgnAnalysis && analysis) setAnalysisMode(true);
  }, [analysis, isPgnAnalysis]);

  useEffect(() => {
    if (!analysisMode || !analysis) return;
    const lastIndex = analysis.positions.length - 1;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight")
        setAnalysisIndex((i) => Math.min(lastIndex, i + 1));
      else if (e.key === "ArrowLeft")
        setAnalysisIndex((i) => Math.max(0, i - 1));
      else if (e.key === "Home") setAnalysisIndex(0);
      else if (e.key === "End") setAnalysisIndex(lastIndex);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [analysisMode, analysis]);

  const isPlayerTurn = playerColor && !isGameOver;
  const baseOrientation = playerColor === "b" ? "black" : "white";
  const orientation = boardFlipped
    ? baseOrientation === "white"
      ? "black"
      : "white"
    : baseOrientation;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-zinc-950">
      {/* Header */}
      <header className="shrink-0 px-4 md:px-8 py-3 md:py-4 flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-2 md:gap-3">
          <span className="text-lg md:text-xl">♟</span>
          <span className="text-white font-semibold tracking-tight text-sm md:text-base">
            Zugzwang
          </span>
          <span className="text-[10px] text-zinc-600 hidden md:inline">
            /ˈtsuːktsvaŋ/
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBoardFlipped((f) => !f)}
            className="text-xs md:text-sm font-semibold rounded-lg px-2 md:px-4 py-1.5 md:py-2 cursor-pointer transition-colors"
            style={{ backgroundColor: "#27272a", color: "#fafafa" }}
          >
            ⇅
          </button>
          <button
            onClick={() => setShowAnalyzeModal(true)}
            className="text-xs md:text-sm font-semibold rounded-lg px-2 md:px-4 py-1.5 md:py-2 cursor-pointer text-white transition-colors"
            style={{ backgroundColor: "#1d4ed8" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#2563eb")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#1d4ed8")
            }
          >
            <span className="hidden md:inline">Analyze Position</span>
            <span className="md:hidden">Analyze</span>
          </button>
        </div>
      </header>

      {/* Main - vertical on mobile, horizontal on desktop */}
      <main className="flex-1 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 px-2 md:px-8 py-3 md:py-6 min-h-0 overflow-y-auto md:overflow-hidden">
        {/* Eval bar + Board */}
        <div className="flex gap-1 md:gap-2 w-full md:w-auto md:h-full items-center justify-center shrink-0 min-h-0">
          {analysisMode && analysis && (
            <EvalBar
              centipawns={analysis.positions[analysisIndex]?.centipawns ?? 0}
              mateIn={analysis.positions[analysisIndex]?.mateIn}
              flipped={orientation === "black"}
            />
          )}
          <div className="aspect-square w-full max-w-[min(90vw,60vh)] md:w-auto md:h-full md:max-w-none">
            <div
              className="transition-all duration-500 w-full h-full relative"
              style={{
                borderRadius: "8px",
                boxShadow: isPlayerTurn
                  ? "0 0 0 2px #166534, 0 0 32px 4px #14532d55"
                  : "0 0 0 1px #27272a",
              }}
            >
              <Chessboard
                options={{
                  boardStyle: {
                    width: "100%",
                    height: "100%",
                    borderRadius: "8px",
                  },
                  position:
                    analysisMode && analysis
                      ? analysis.positions[analysisIndex].fen
                      : fen,
                  onPieceDrop,
                  boardOrientation: orientation,
                  darkSquareStyle: { backgroundColor: "#4a7c59" },
                  lightSquareStyle: { backgroundColor: "#f0ead6" },
                  allowDragging: !analysisMode && !isGameOver,
                }}
              />
              {!playerColor && <ColorPicker onSelect={handleColorSelect} />}
              {pendingPromotion && (
                <PromotionPicker
                  square={pendingPromotion.to}
                  onSelect={confirmPromotion}
                  onCancel={cancelPromotion}
                />
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-72 md:shrink-0 flex flex-col gap-3 min-h-0 md:h-full pb-4 md:pb-0">
          <Sidebar
            levelIndex={levelIndex}
            weights={weights}
            history={history}
            status={status}
            isGameOver={isGameOver}
            isPlayerTurn={isPlayerTurn}
            analysis={analysis}
            analysisMode={analysisMode}
            analysisIndex={analysisIndex}
            pgn={pgn}
            onAnalyze={handleAnalyze}
            onAnalysisStep={setAnalysisIndex}
            onLevelChange={handleLevelChange}
            onPresetChange={handlePresetChange}
            onNewGame={handleNewGame}
          />
        </div>
      </main>

      {showAnalyzeModal && (
        <AnalyzeModal
          onAnalyzePgn={handleAnalyzePgn}
          onClose={() => setShowAnalyzeModal(false)}
        />
      )}
    </div>
  );
}
