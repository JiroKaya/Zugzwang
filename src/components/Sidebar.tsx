import { useState } from "react";
import type { PersonalityWeights } from "../engine/personalities";
import { PRESETS } from "../engine/personalities";
import { LEVELS } from "../engine/levels";
import type { GameAnalysis, MoveClassification } from "../engine/analysis";

const CLASSIFICATION_COLORS: Record<string, string> = {
  brilliant: "#1baca6",
  best: "#16a34a",
  excellent: "#65a30d",
  good: "#84cc16",
  inaccuracy: "#f59e0b",
  mistake: "#f97316",
  blunder: "#ef4444",
};

const CLASSIFICATION_SYMBOLS: Record<string, string> = {
  brilliant: "!!",
  best: "✓",
  excellent: "!",
  good: "",
  inaccuracy: "?!",
  mistake: "?",
  blunder: "??",
};

const CLASSIFICATION_LABELS: Record<string, string> = {
  brilliant: "Brilliant",
  best: "Best",
  excellent: "Excellent",
  good: "Good",
  inaccuracy: "Inaccuracy",
  mistake: "Mistake",
  blunder: "Blunder",
};

interface Props {
  levelIndex: number;
  weights: PersonalityWeights;
  history: string[];
  status: string;
  isGameOver: boolean;
  isPlayerTurn: boolean | null;
  analysis: GameAnalysis | null;
  analysisMode: boolean;
  analysisIndex: number;
  pgn: string;
  onAnalyze: () => void;
  onAnalysisStep: (i: number) => void;
  onLevelChange: (index: number) => void;
  onPresetChange: (weights: PersonalityWeights) => void;
  onNewGame: () => void;
}

function countClassifications(
  analysis: GameAnalysis,
  color: "w" | "b",
): Record<MoveClassification, number> {
  const counts: Record<MoveClassification, number> = {
    brilliant: 0,
    best: 0,
    excellent: 0,
    good: 0,
    inaccuracy: 0,
    mistake: 0,
    blunder: 0,
  };
  analysis.positions
    .filter((p) => p.color === color)
    .forEach((p) => {
      if (p.classification) counts[p.classification]++;
    });
  return counts;
}

export function Sidebar({
  levelIndex,
  weights,
  history,
  status,
  isGameOver,
  isPlayerTurn,
  analysis,
  analysisMode,
  analysisIndex,
  pgn,
  onAnalyze,
  onAnalysisStep,
  onLevelChange,
  onPresetChange,
  onNewGame,
}: Props) {
  const [detailView, setDetailView] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleCopyPgn() {
    navigator.clipboard.writeText(pgn);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  // Reset detail view when analysis changes
  if (!analysisMode && detailView) setDetailView(false);

  if (analysisMode && analysis) {
    if (!detailView) {
      const whiteCounts = countClassifications(analysis, "w");
      const blackCounts = countClassifications(analysis, "b");
      const classifications: MoveClassification[] = [
        "brilliant",
        "best",
        "excellent",
        "good",
        "inaccuracy",
        "mistake",
        "blunder",
      ];

      return (
        <div className="flex flex-col gap-3 h-full">
          {/* ELO */}
          <div
            className="rounded-xl p-4 flex flex-col gap-3 shrink-0"
            style={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}
          >
            <h3
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#71717a" }}
            >
              Performance Rating
            </h3>
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs" style={{ color: "#71717a" }}>
                  White
                </span>
                <span className="text-2xl font-bold text-white">
                  {analysis.whiteElo}
                </span>
              </div>
              <div className="text-zinc-600 text-sm">vs</div>
              <div className="flex flex-col gap-0.5 items-end">
                <span className="text-xs" style={{ color: "#71717a" }}>
                  Black
                </span>
                <span className="text-2xl font-bold text-white">
                  {analysis.blackElo}
                </span>
              </div>
            </div>
          </div>

          {/* Accuracy */}
          <div className="flex justify-between items-center mt-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs" style={{ color: "#71717a" }}>
                Accuracy
              </span>
              <span className="text-lg font-bold" style={{ color: "#16a34a" }}>
                {analysis.whiteAccuracy}%
              </span>
            </div>
            <div className="flex flex-col gap-0.5 items-end">
              <span className="text-xs" style={{ color: "#71717a" }}>
                Accuracy
              </span>
              <span className="text-lg font-bold" style={{ color: "#16a34a" }}>
                {analysis.blackAccuracy}%
              </span>
            </div>
          </div>

          {/* Summary table */}
          <div
            className="rounded-xl p-4 flex flex-col gap-3 flex-1 min-h-0"
            style={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}
          >
            <div
              className="flex justify-between text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#71717a" }}
            >
              <span>Move</span>
              <div className="flex gap-6">
                <span>White</span>
                <span>Black</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {classifications.map((c) => (
                <div
                  key={c}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span style={{ color: CLASSIFICATION_COLORS[c] }}>
                      {CLASSIFICATION_SYMBOLS[c] || "·"}
                    </span>
                    <span className="text-zinc-300">
                      {CLASSIFICATION_LABELS[c]}
                    </span>
                  </div>
                  <div className="flex gap-8">
                    <span
                      className="w-6 text-center font-semibold"
                      style={{
                        color:
                          whiteCounts[c] > 0
                            ? CLASSIFICATION_COLORS[c]
                            : "#3f3f46",
                      }}
                    >
                      {whiteCounts[c]}
                    </span>
                    <span
                      className="w-6 text-center font-semibold"
                      style={{
                        color:
                          blackCounts[c] > 0
                            ? CLASSIFICATION_COLORS[c]
                            : "#3f3f46",
                      }}
                    >
                      {blackCounts[c]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={() => setDetailView(true)}
              className="w-full text-sm font-semibold rounded-lg px-4 py-2 text-white cursor-pointer transition-colors"
              style={{ backgroundColor: "#1d4ed8" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#2563eb")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#1d4ed8")
              }
            >
              Analyze Move by Move
            </button>
            <button
              onClick={handleCopyPgn}
              className="flex-1 text-sm font-semibold rounded-lg px-4 py-2 cursor-pointer transition-colors"
              style={{
                backgroundColor: copied ? "#166534" : "#27272a",
                color: "#fafafa",
              }}
            >
              {copied ? "✓ Copied" : "Copy PGN"}
            </button>
            <button
              onClick={onNewGame}
              className="w-full text-sm font-semibold rounded-lg px-4 py-2 text-white cursor-pointer transition-colors"
              style={{ backgroundColor: "#166534" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#16a34a")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#166534")
              }
            >
              New Game
            </button>
          </div>
        </div>
      );
    }

    // Detail view
    return (
      <div className="flex flex-col gap-3 h-full">
        {/* ELO */}
        <div
          className="rounded-xl p-4 flex justify-between items-center shrink-0"
          style={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-xs" style={{ color: "#71717a" }}>
              White
            </span>
            <span className="text-lg font-bold text-white">
              {analysis.whiteElo}
            </span>
          </div>
          <button
            onClick={() => setDetailView(false)}
            className="text-xs cursor-pointer"
            style={{ color: "#71717a" }}
          >
            ← Summary
          </button>
          <div className="flex flex-col gap-0.5 items-end">
            <span className="text-xs" style={{ color: "#71717a" }}>
              Black
            </span>
            <span className="text-lg font-bold text-white">
              {analysis.blackElo}
            </span>
          </div>
        </div>

        {/* Step controls */}
        <div
          className="rounded-xl p-3 flex items-center justify-between shrink-0"
          style={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}
        >
          <button
            onClick={() => onAnalysisStep(0)}
            disabled={analysisIndex === 0}
            className="px-2 py-1 rounded text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
          >
            ««
          </button>
          <button
            onClick={() => onAnalysisStep(Math.max(0, analysisIndex - 1))}
            disabled={analysisIndex === 0}
            className="px-2 py-1 rounded text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
          >
            ‹
          </button>
          <span className="text-xs text-zinc-400">
            Move {analysisIndex + 1} / {analysis.positions.length}
          </span>
          <button
            onClick={() =>
              onAnalysisStep(
                Math.min(analysis.positions.length - 1, analysisIndex + 1),
              )
            }
            disabled={analysisIndex === analysis.positions.length - 1}
            className="px-2 py-1 rounded text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
          >
            ›
          </button>
          <button
            onClick={() => onAnalysisStep(analysis.positions.length - 1)}
            disabled={analysisIndex === analysis.positions.length - 1}
            className="px-2 py-1 rounded text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
          >
            »»
          </button>
        </div>

        {/* Move list */}
        <div
          className="rounded-xl p-4 flex flex-col gap-3 flex-1 min-h-0"
          style={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}
        >
          <h3
            className="text-xs font-semibold uppercase tracking-widest shrink-0"
            style={{ color: "#71717a" }}
          >
            Move Analysis
          </h3>
          <div className="overflow-y-auto flex-1 flex flex-col gap-0.5">
            {Array.from({
              length: Math.ceil(analysis.positions.length / 2),
            }).map((_, i) => {
              const whitePos = analysis.positions[i * 2];
              const blackPos = analysis.positions[i * 2 + 1];
              return (
                <div key={i} className="flex gap-2 text-xs">
                  <span
                    className="w-5 shrink-0 tabular-nums"
                    style={{ color: "#3f3f46" }}
                  >
                    {i + 1}.
                  </span>
                  {whitePos && (
                    <button
                      onClick={() => onAnalysisStep(i * 2)}
                      className="w-20 text-left px-1.5 py-0.5 rounded cursor-pointer"
                      style={{
                        backgroundColor:
                          analysisIndex === i * 2 ? "#27272a" : "transparent",
                        color:
                          CLASSIFICATION_COLORS[
                            whitePos.classification ?? "good"
                          ],
                      }}
                    >
                      {whitePos.moveSan}
                      <span className="ml-1">
                        {
                          CLASSIFICATION_SYMBOLS[
                            whitePos.classification ?? "good"
                          ]
                        }
                      </span>
                    </button>
                  )}
                  {blackPos && (
                    <button
                      onClick={() => onAnalysisStep(i * 2 + 1)}
                      className="w-20 text-left px-1.5 py-0.5 rounded cursor-pointer"
                      style={{
                        backgroundColor:
                          analysisIndex === i * 2 + 1
                            ? "#27272a"
                            : "transparent",
                        color:
                          CLASSIFICATION_COLORS[
                            blackPos.classification ?? "good"
                          ],
                      }}
                    >
                      {blackPos.moveSan}
                      <span className="ml-1">
                        {
                          CLASSIFICATION_SYMBOLS[
                            blackPos.classification ?? "good"
                          ]
                        }
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={onNewGame}
          className="w-full text-sm font-semibold rounded-lg px-4 py-2 text-white shrink-0 cursor-pointer transition-colors"
          style={{ backgroundColor: "#166534" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#16a34a")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#166534")
          }
        >
          New Game
        </button>
      </div>
    );
  }

  // Normal game view
  return (
    <div className="flex flex-col gap-3 h-full">
      <div
        className="rounded-xl px-4 py-3 flex items-center gap-2 shrink-0"
        style={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}
      >
        {!isGameOver && (
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: isPlayerTurn ? "#16a34a" : "#71717a" }}
          />
        )}
        <span className="text-sm text-zinc-300">{status}</span>
      </div>

      <div
        className="rounded-xl p-4 flex flex-col gap-4 shrink-0"
        style={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}
      >
        <div className="flex flex-col gap-1.5">
          <label
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "#71717a" }}
          >
            Difficulty
          </label>
          <select
            value={levelIndex}
            onChange={(e) => onLevelChange(Number(e.target.value))}
            className="text-sm rounded-lg px-3 py-2 outline-none cursor-pointer appearance-none"
            style={{
              backgroundColor: "#09090b",
              color: "#fafafa",
              border: "1px solid #27272a",
            }}
          >
            {LEVELS.map((level, i) => (
              <option key={i} value={i}>
                {level.label} — ~{level.elo} ELO
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "#71717a" }}
          >
            Play Style
          </label>
          <select
            value={JSON.stringify(weights)}
            onChange={(e) => onPresetChange(JSON.parse(e.target.value))}
            className="text-sm rounded-lg px-3 py-2 outline-none cursor-pointer appearance-none"
            style={{
              backgroundColor: "#09090b",
              color: "#fafafa",
              border: "1px solid #27272a",
            }}
          >
            {Object.entries(PRESETS).map(([name, w]) => (
              <option key={name} value={JSON.stringify(w)}>
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onNewGame}
            className="flex-1 text-sm font-semibold rounded-lg px-4 py-2 text-white cursor-pointer transition-colors"
            style={{ backgroundColor: "#166534" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#16a34a")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#166534")
            }
          >
            New Game
          </button>
          {isGameOver && (
            <>
              <button
                onClick={onAnalyze}
                className="flex-1 text-sm font-semibold rounded-lg px-4 py-2 text-white cursor-pointer transition-colors"
                style={{ backgroundColor: "#1d4ed8" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#2563eb")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#1d4ed8")
                }
              >
                Analyze
              </button>
              <button
                onClick={handleCopyPgn}
                className="flex-1 text-sm font-semibold rounded-lg px-4 py-2 cursor-pointer transition-colors"
                style={{
                  backgroundColor: copied ? "#166534" : "#27272a",
                  color: "#fafafa",
                }}
              >
                {copied ? "✓ Copied" : "Copy PGN"}
              </button>
            </>
          )}
        </div>
      </div>

      <div
        className="rounded-xl p-4 flex flex-col gap-3 flex-1 min-h-0"
        style={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}
      >
        <h3
          className="text-xs font-semibold uppercase tracking-widest shrink-0"
          style={{ color: "#71717a" }}
        >
          Move History
        </h3>
        <div className="overflow-y-auto flex-1 flex flex-col gap-0.5 pr-1">
          {history.length === 0 ? (
            <p className="text-xs" style={{ color: "#3f3f46" }}>
              No moves yet
            </p>
          ) : (
            Array.from({ length: Math.ceil(history.length / 2) }).map(
              (_, i) => (
                <div key={i} className="flex gap-3 text-xs py-0.5">
                  <span
                    className="w-5 shrink-0 tabular-nums"
                    style={{ color: "#3f3f46" }}
                  >
                    {i + 1}.
                  </span>
                  <span className="w-10 shrink-0" style={{ color: "#fafafa" }}>
                    {history[i * 2]}
                  </span>
                  <span style={{ color: "#71717a" }}>
                    {history[i * 2 + 1] ?? ""}
                  </span>
                </div>
              ),
            )
          )}
        </div>
      </div>
    </div>
  );
}
