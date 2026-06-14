import { useState } from "react";
import { Chess } from "chess.js";

interface Props {
  onAnalyzePgn: (
    moves: {
      fen: string;
      moveSan: string;
      color: "w" | "b";
      moveNumber: number;
    }[],
  ) => void;
  onClose: () => void;
}

export function AnalyzeModal({ onAnalyzePgn, onClose }: Props) {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    const trimmed = input.trim();
    if (!trimmed) {
      setError("Please paste a PGN or FEN");
      return;
    }

    try {
      const game = new Chess();
      game.loadPgn(trimmed);

      const history = game.history({ verbose: true });
      if (history.length === 0) {
        setError("No moves found in PGN");
        return;
      }

      // replay moves and collect FEN after each one
      const replay = new Chess();
      const moves = history.map((move, i) => {
        replay.move(move);
        return {
          fen: replay.fen(),
          moveSan: move.san, // moveSan, not san
          color: move.color as "w" | "b",
          moveNumber: Math.ceil((i + 1) / 2),
        };
      });

      setError(null);
      onAnalyzePgn(moves);
    } catch {
      setError(
        "Invalid PGN — please paste a valid PGN from chess.com or lichess",
      );
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "#09090b99", backdropFilter: "blur(4px)" }}
    >
      <div
        className="flex flex-col gap-4 rounded-2xl p-4 md:p-6 w-[calc(100%-2rem)] md:w-120"
        style={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold">Analyze Game</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "#71717a" }}
          >
            PGN
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your PGN from chess.com or lichess here..."
            rows={5}
            className="text-sm rounded-lg px-3 py-2 outline-none resize-none text-white placeholder-zinc-600"
            style={{ backgroundColor: "#09090b", border: "1px solid #27272a" }}
          />
          {error && (
            <p className="text-xs" style={{ color: "#ef4444" }}>
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 text-sm font-semibold rounded-lg px-4 py-2 cursor-pointer text-zinc-400 hover:text-white transition-colors"
            style={{ backgroundColor: "#09090b", border: "1px solid #27272a" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 text-sm font-semibold rounded-lg px-4 py-2 cursor-pointer text-white transition-colors"
            style={{ backgroundColor: "#166534" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#16a34a")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#166534")
            }
          >
            Analyze
          </button>
        </div>
      </div>
    </div>
  );
}
