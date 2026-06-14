interface Props {
  onSelect: (color: "w" | "b" | "random") => void;
}

export function ColorPicker({ onSelect }: Props) {
  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center"
      style={{ backgroundColor: "#09090bcc", backdropFilter: "blur(4px)" }}
    >
      <div
        className="flex flex-col gap-4 rounded-2xl p-4 md:p-6 w-[calc(100%-2rem)] md:w-120"
        style={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}
      >
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-white font-semibold text-lg tracking-tight">
            Choose your side
          </h2>
          <p className="text-xs" style={{ color: "#71717a" }}>
            Select a color to begin
          </p>
        </div>

        <div className="flex gap-3 justify-around">
          {[
            { color: "w" as const, icon: "♚", label: "White" },
            { color: "random" as const, icon: "🎲", label: "Random" },
            { color: "b" as const, icon: "♔", label: "Black" },
          ].map(({ color, icon, label }) => (
            <button
              key={color}
              onClick={() => onSelect(color)}
              className="flex flex-col items-center gap-2 px-5 py-4 rounded-xl cursor-pointer transition-all text-white"
              style={{
                backgroundColor: "#09090b",
                border: "1px solid #27272a",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#166534";
                e.currentTarget.style.backgroundColor = "#14532d22";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#27272a";
                e.currentTarget.style.backgroundColor = "#09090b";
              }}
            >
              <span className="text-4xl">{icon}</span>
              <span
                className="text-xs font-medium"
                style={{ color: "#71717a" }}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
