import { useEffect, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Sidebar } from "./components/Sidebar";
import { ColorPicker } from "./components/ColorPicker";
import { PromotionPicker } from "./components/PromotionPicker";
import { AnalyzeModal } from "./components/AnalyzeModal";
import { useChessGame } from "./hooks/useChessGame";
import { useAnalysis } from "./hooks/useAnalysis";
import { DEFAULT_WEIGHTS } from "./engine/personalities";
import type { PersonalityWeights } from "./engine/personalities";
import { Chess } from "chess.js";
import { EvalBar } from "./components/EvalBar";

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

  const baseOrientation = playerColor === "b" ? "black" : "white";
  const orientation = boardFlipped
    ? baseOrientation === "white"
      ? "black"
      : "white"
    : baseOrientation;

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
    setIsPgnAnalysis(true); // reuse the same "switch to analysis when ready" effect
  }

  useEffect(() => {
    if (isPgnAnalysis && analysis) setAnalysisMode(true);
  }, [analysis, isPgnAnalysis]);

  useEffect(() => {
    if (!analysisMode || !analysis) return;

    const lastIndex = analysis.positions.length - 1;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") {
        setAnalysisIndex((i) => Math.min(lastIndex, i + 1));
      } else if (e.key === "ArrowLeft") {
        setAnalysisIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "Home") {
        setAnalysisIndex(0);
      } else if (e.key === "End") {
        setAnalysisIndex(lastIndex);
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [analysisMode, analysis]);

  const isPlayerTurn = playerColor && !isGameOver;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-zinc-950">
      <header className="shrink-0 px-8 py-4 flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <span className="text-xl">♟</span>
          <span className="text-white font-semibold tracking-tight">
            Zugzwang
          </span>
        </div>
        <div>
          <button
            onClick={() => setBoardFlipped((f) => !f)}
            className="text-sm font-semibold rounded-lg px-4 py-2 cursor-pointer transition-colors mx-2"
            style={{ backgroundColor: "#27272a", color: "#fafafa" }}
          >
            ⇅ Flip
          </button>
          <button
            onClick={() => setShowAnalyzeModal(true)}
            className="text-sm font-semibold rounded-lg px-4 py-2 cursor-pointer text-white transition-colors"
            style={{ backgroundColor: "#166534" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#16a34a")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#166534")
            }
          >
            Analyze Position
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center gap-6 px-8 py-6 min-h-0">
        {analysisMode && analysis && (
          <EvalBar
            centipawns={analysis.positions[analysisIndex]?.centipawns ?? 0}
            mateIn={analysis.positions[analysisIndex]?.mateIn}
            flipped={orientation === "black"}
          />
        )}
        <div style={{ height: "100%", aspectRatio: "1", position: "relative" }}>
          <div
            className="transition-all duration-500"
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "12px",
              boxShadow: isPlayerTurn
                ? "0 0 0 2px #166534, 0 0 32px 4px #14532d55"
                : "0 0 0 1px #27272a",
              position: "relative",
            }}
          >
            <Chessboard
              options={{
                boardStyle: {
                  width: "100%",
                  height: "100%",
                  borderRadius: "12px",
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

        <div
          className="shrink-0 w-72 flex flex-col gap-3"
          style={{ height: "100%" }}
        >
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
            onAnalyze={handleAnalyze}
            onAnalysisStep={setAnalysisIndex}
            onLevelChange={handleLevelChange}
            onPresetChange={handlePresetChange}
            onNewGame={handleNewGame}
            pgn={pgn}
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
