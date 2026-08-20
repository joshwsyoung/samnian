const TRAITS = [
  { key: "openness", label: "O" },
  { key: "conscientiousness", label: "C" },
  { key: "extraversion", label: "E" },
  { key: "agreeableness", label: "A" },
  { key: "neuroticism", label: "N" },
] as const;

type Scores = Record<(typeof TRAITS)[number]["key"], number>;

/** A quick 5-bar preview of OCEAN scores (0-5 scale) — the full breakdown lives on Profile. */
export default function OceanSparkline({ scores }: { scores: Scores }) {
  return (
    <div className="sm-ocean-bars" aria-hidden="true">
      {TRAITS.map((t) => (
        <div
          key={t.key}
          className="sm-bar"
          style={{ height: `${Math.max(8, (scores[t.key] / 5) * 100)}%` }}
          title={`${t.label}: ${scores[t.key].toFixed(1)}/5`}
        />
      ))}
    </div>
  );
}
