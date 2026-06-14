import type { PromotionPiece } from "../hooks/useChessGame";

interface Props {
  onSelect: (piece: PromotionPiece) => void;
  onCancel: () => void;
  square: string; // the target square e.g. "e8"
}

const PIECES: { piece: PromotionPiece; label: string }[] = [
  { piece: "q", label: "♛" },
  { piece: "r", label: "♜" },
  { piece: "b", label: "♝" },
  { piece: "n", label: "♞" },
];

export function PromotionPicker({ onSelect, onCancel, square }: Props) {
  // calculate file (0-7) from square name e.g. "e8" -> 4
  const file = square.charCodeAt(0) - "a".charCodeAt(0);
  const leftPercent = (file / 8) * 100;

  return (
    <>
      {/* Backdrop */}
      <div className="absolute inset-0 z-10" onClick={onCancel} />

      {/* Picker */}
      <div
        className="absolute top-0 z-20 flex flex-col rounded-lg overflow-hidden shadow-2xl border border-gray-700"
        style={{ left: `calc(${leftPercent}% - 4px)` }}
      >
        {PIECES.map(({ piece, label }) => (
          <button
            key={piece}
            onClick={() => onSelect(piece)}
            className="w-16 h-16 bg-gray-800 hover:bg-indigo-600 text-4xl flex items-center justify-center transition-colors cursor-pointer"
          >
            {label}
          </button>
        ))}
      </div>
    </>
  );
}
