import {
  STATUS_COLORS,
  STATUS_LABELS,
  type MocStatus,
} from "@/lib/constants";

export function StatusBadge({ status }: { status: string }) {
  const s = status as MocStatus;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[s] ?? "bg-gray-100 text-gray-700 border-gray-300"}`}
    >
      {STATUS_LABELS[s] ?? status}
    </span>
  );
}

export function LevelBadge({ level }: { level: number | null }) {
  if (!level) return null;
  const colors: Record<number, string> = {
    1: "bg-vantage-50 text-vantage-700 border-vantage-100",
    2: "bg-sky-50 text-sky-800 border-sky-200",
    3: "bg-amber-50 text-amber-800 border-amber-200",
    4: "bg-red-50 text-red-800 border-red-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${colors[level]}`}
    >
      Level {level}
    </span>
  );
}
