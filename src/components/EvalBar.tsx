import { cpToWinPercent } from "../engine/analysis";

interface Props {
  centipawns: number;
  mateIn?: number;
  flipped: boolean;
}

export function EvalBar({ centipawns, mateIn, flipped }: Props) {
  // when there's a mate, the bar is fully one side
  const whitePercent =
    mateIn !== undefined
      ? mateIn === 0
        ? centipawns >= 0
          ? 100
          : 0
        : mateIn > 0
          ? 100
          : 0
      : cpToWinPercent(centipawns);
  const whiteHeight = `${whitePercent}%`;

  const label =
    mateIn !== undefined
      ? mateIn === 0
        ? "#"
        : `M${Math.abs(mateIn)}`
      : (() => {
          const pawns = centipawns / 100;
          return `${pawns >= 0 ? "+" : ""}${pawns.toFixed(1)}`;
        })();

  const labelOnWhiteSide = whitePercent > 8;

  return (
    <div
      className="relative w-6 rounded-md overflow-hidden shrink-0"
      style={{ height: "100%", backgroundColor: "#27272a" }}
    >
      <div
        className="absolute left-0 right-0 transition-all duration-300"
        style={{
          height: whiteHeight,
          backgroundColor: "#f0ead6",
          [flipped ? "top" : "bottom"]: 0,
        }}
      />
      <span
        className="absolute left-1/2 -translate-x-1/2 text-[10px] font-bold tabular-nums"
        style={{
          [flipped ? "top" : "bottom"]: "4px",
          color: labelOnWhiteSide ? "#09090b" : "#fafafa",
        }}
      >
        {label}
      </span>
    </div>
  );
}
