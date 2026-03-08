"use client";

import { useState, useCallback } from "react";

/* ---- types matching the new prompt structure ---- */
type FlywheelNode = { node: string; status: string; score: number; current_metric: string; benchmark: string; diagnosis: string; fix: string };
type FlywheelSection = { id: "flywheel_health"; title: string; sections: FlywheelNode[]; overall_score: number; bottleneck: string; flywheel_momentum: string };

type MonetizationTopic = { topic: string; finding: string; implication: string; action: string };
type MonetizationSection = { id: "monetization_depth"; title: string; sections: MonetizationTopic[]; revenue_projection: string };

type ChannelRow = { channel: string; volume: string; unlock_conversion: string; pay_conversion: string; revenue: string; flywheel_fit: string; verdict: string; reason: string };
type ChannelSection = { id: "channel_quality"; title: string; channels: ChannelRow[]; organic_vs_paid: string; referral_health: string };

type RetentionFinding = { insight: string; data: string; so_what: string; action: string };
type RetentionSection = { id: "retention_unlock"; title: string; findings: RetentionFinding[] };

type GeoMarket = { country: string; users: string; flywheel_status: string; strength: string; weakness: string; strategy: string };
type GeoSection = { id: "geo_flywheel"; title: string; markets: GeoMarket[]; priority_market: string };

type ActionItem = { priority: number; action: string; flywheel_node: string; expected_impact: string; effort: string; success_metric: string };
type ActionsSection = { id: "weekly_actions"; title: string; actions: ActionItem[]; north_star_this_week: string };

type Section = FlywheelSection | MonetizationSection | ChannelSection | RetentionSection | GeoSection | ActionsSection;

type Props = {
  dashboardData: Record<string, unknown>;
  t: (key: string) => string;
};

const cardStyle = { border: "1px solid var(--card-stroke)", boxShadow: "var(--card-shadow)" } as const;
const subCardStyle = { backgroundColor: "var(--background)" } as const;

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const color = s === "healthy" ? "#34a853" : s === "warning" ? "#b88a00" : "#ea4335";
  const bg = s === "healthy" ? "rgba(52,168,83,0.08)" : s === "warning" ? "rgba(251,188,4,0.08)" : "rgba(234,67,53,0.08)";
  const label = s === "healthy" ? "Healthy" : s === "warning" ? "Warning" : "Broken";
  return <span className="inline-block rounded px-1.5 py-0.5 text-[9px] font-semibold" style={{ color, backgroundColor: bg }}>{label}</span>;
}

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = (score / max) * 100;
  const color = score >= 7 ? "#34a853" : score >= 4 ? "#b88a00" : "#ea4335";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: "var(--border)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[10px] font-bold" style={{ color }}>{score}/{max}</span>
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const v = verdict.toLowerCase();
  const color = v.includes("加码") ? "#34a853" : v.includes("暂停") || v.includes("停") ? "#ea4335" : "#4285f4";
  const bg = v.includes("加码") ? "rgba(52,168,83,0.08)" : v.includes("暂停") || v.includes("停") ? "rgba(234,67,53,0.08)" : "rgba(66,133,244,0.08)";
  return <span className="inline-block rounded px-1.5 py-0.5 text-[9px] font-semibold" style={{ color, backgroundColor: bg }}>{verdict}</span>;
}

/* ---- Section Renderers ---- */

function FlywheelCard({ section }: { section: FlywheelSection }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] text-[var(--secondary-text)]">Overall Score</span>
        <div className="w-[200px]"><ScoreBar score={section.overall_score} /></div>
      </div>
      <div className="space-y-2">
        {section.sections.map((node, i) => (
          <div key={i} className="rounded-lg px-3 py-2.5" style={subCardStyle}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold">{node.node}</span>
                <StatusBadge status={node.status} />
              </div>
              <div className="w-[100px]"><ScoreBar score={node.score} /></div>
            </div>
            <div className="mt-1.5 flex gap-3 text-[9px] text-[var(--secondary-text)]">
              <span>Current: <strong className="text-[var(--foreground)]">{node.current_metric}</strong></span>
              <span>Benchmark: {node.benchmark}</span>
            </div>
            <p className="mt-1 text-[10px] text-[var(--foreground)]">{node.diagnosis}</p>
            <p className="mt-1 text-[10px] text-[var(--accent)]">{node.fix}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-2">
        <div className="rounded-lg p-2.5" style={{ backgroundColor: "rgba(234,67,53,0.04)", border: "1px solid rgba(234,67,53,0.1)" }}>
          <p className="text-[10px] font-semibold text-[#ea4335]">Bottleneck</p>
          <p className="mt-0.5 text-[10px]">{section.bottleneck}</p>
        </div>
        <div className="rounded-lg p-2.5" style={subCardStyle}>
          <p className="text-[10px] font-semibold text-[var(--secondary-text)]">Momentum</p>
          <p className="mt-0.5 text-[10px]">{section.flywheel_momentum}</p>
        </div>
      </div>
    </div>
  );
}

function MonetizationCard({ section }: { section: MonetizationSection }) {
  return (
    <div>
      <div className="space-y-2">
        {section.sections.map((t, i) => (
          <div key={i} className="rounded-lg px-3 py-2.5" style={subCardStyle}>
            <p className="text-[11px] font-semibold">{t.topic}</p>
            <p className="mt-1 text-[10px]">{t.finding}</p>
            <p className="mt-1 text-[10px] text-[var(--secondary-text)]">{t.implication}</p>
            <p className="mt-1 text-[10px] text-[var(--accent)]">{t.action}</p>
          </div>
        ))}
      </div>
      {section.revenue_projection && (
        <div className="mt-3 rounded-lg p-2.5" style={{ backgroundColor: "rgba(52,168,83,0.04)", border: "1px solid rgba(52,168,83,0.1)" }}>
          <p className="text-[10px] font-semibold text-[#34a853]">Revenue Projection</p>
          <p className="mt-0.5 text-[10px]">{section.revenue_projection}</p>
        </div>
      )}
    </div>
  );
}

function ChannelsCard({ section }: { section: ChannelSection }) {
  return (
    <div>
      <div className="space-y-2">
        {section.channels.map((ch, i) => (
          <div key={i} className="rounded-lg px-3 py-2.5" style={subCardStyle}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold">{ch.channel}</span>
              <VerdictBadge verdict={ch.verdict} />
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[9px] text-[var(--secondary-text)]">
              <span>Volume: <strong className="text-[var(--foreground)]">{ch.volume}</strong></span>
              <span>Unlock: {ch.unlock_conversion}</span>
              <span>Pay: {ch.pay_conversion}</span>
              <span>Rev: {ch.revenue}</span>
            </div>
            <p className="mt-1 text-[10px]">{ch.flywheel_fit}</p>
            <p className="mt-0.5 text-[9px] text-[var(--secondary-text)]">{ch.reason}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-2">
        <div className="rounded-lg p-2.5" style={subCardStyle}>
          <p className="text-[10px] font-semibold">Organic vs Paid</p>
          <p className="mt-0.5 text-[10px] text-[var(--secondary-text)]">{section.organic_vs_paid}</p>
        </div>
        <div className="rounded-lg p-2.5" style={subCardStyle}>
          <p className="text-[10px] font-semibold">Referral Health</p>
          <p className="mt-0.5 text-[10px] text-[var(--secondary-text)]">{section.referral_health}</p>
        </div>
      </div>
    </div>
  );
}

function RetentionCard({ section }: { section: RetentionSection }) {
  return (
    <div className="space-y-2">
      {section.findings.map((f, i) => (
        <div key={i} className="rounded-lg px-3 py-2.5" style={subCardStyle}>
          <p className="text-[11px] font-semibold">{f.insight}</p>
          <p className="mt-1 text-[10px] text-[var(--secondary-text)]">{f.data}</p>
          <p className="mt-1 text-[10px]">{f.so_what}</p>
          <p className="mt-1 text-[10px] text-[var(--accent)]">{f.action}</p>
        </div>
      ))}
    </div>
  );
}

function GeoCard({ section }: { section: GeoSection }) {
  return (
    <div>
      <div className="space-y-2">
        {section.markets.map((m, i) => (
          <div key={i} className="rounded-lg px-3 py-2.5" style={subCardStyle}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold">{m.country}</span>
              <span className="text-[9px] text-[var(--secondary-text)]">{m.users} users</span>
            </div>
            <p className="mt-1 text-[10px]">{m.flywheel_status}</p>
            <div className="mt-1 flex gap-4 text-[9px]">
              <span className="text-[#34a853]">+{m.strength}</span>
              <span className="text-[#ea4335]">-{m.weakness}</span>
            </div>
            <p className="mt-1 text-[10px] text-[var(--accent)]">{m.strategy}</p>
          </div>
        ))}
      </div>
      {section.priority_market && (
        <div className="mt-3 rounded-lg p-2.5" style={{ backgroundColor: "rgba(66,133,244,0.04)", border: "1px solid rgba(66,133,244,0.1)" }}>
          <p className="text-[10px] font-semibold text-[#4285f4]">Priority Market</p>
          <p className="mt-0.5 text-[10px]">{section.priority_market}</p>
        </div>
      )}
    </div>
  );
}

function ActionsCard({ section }: { section: ActionsSection }) {
  return (
    <div>
      <div className="space-y-2">
        {section.actions.map((a, i) => (
          <div key={i} className="rounded-lg px-3 py-2.5" style={{
            backgroundColor: i === 0 ? "rgba(66,133,244,0.04)" : "var(--background)",
            border: i === 0 ? "1px solid rgba(66,133,244,0.12)" : "1px solid transparent"
          }}>
            <div className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{
                backgroundColor: i === 0 ? "#4285f4" : i === 1 ? "#34a853" : "#b88a00"
              }}>{a.priority}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold">{a.action}</p>
                <p className="mt-0.5 text-[9px] text-[var(--secondary-text)]">Node: {a.flywheel_node}</p>
                <p className="mt-1 text-[10px]">{a.expected_impact}</p>
                <div className="mt-1 flex gap-4 text-[9px] text-[var(--secondary-text)]">
                  <span>Effort: {a.effort}</span>
                  <span>Metric: {a.success_metric}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {section.north_star_this_week && (
        <div className="mt-3 rounded-lg p-2.5" style={{ backgroundColor: "rgba(66,133,244,0.04)", border: "1px solid rgba(66,133,244,0.1)" }}>
          <p className="text-[10px] font-semibold text-[#4285f4]">North Star This Week</p>
          <p className="mt-0.5 text-[10px]">{section.north_star_this_week}</p>
        </div>
      )}
    </div>
  );
}

function renderSection(section: Section) {
  switch (section.id) {
    case "flywheel_health": return <FlywheelCard section={section} />;
    case "monetization_depth": return <MonetizationCard section={section} />;
    case "channel_quality": return <ChannelsCard section={section} />;
    case "retention_unlock": return <RetentionCard section={section} />;
    case "geo_flywheel": return <GeoCard section={section} />;
    case "weekly_actions": return <ActionsCard section={section} />;
    default: return <pre className="text-[10px] whitespace-pre-wrap">{JSON.stringify(section, null, 2)}</pre>;
  }
}

/* ---- Main Component ---- */
export function AIInsightsSection({ dashboardData, t }: Props) {
  const [sections, setSections] = useState<Section[] | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSections(null);
    setRawText(null);
    try {
      const res = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dashboardData }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      if (data.sections) {
        setSections(data.sections);
        const all: Record<string, boolean> = {};
        for (const s of data.sections) all[s.id] = true;
        setExpanded(all);
      } else if (data.raw) {
        setRawText(data.raw);
      }
      setGeneratedAt(data.generated_at || new Date().toISOString());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [dashboardData]);

  const toggleSection = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <section className="mb-8">
      <div className="overflow-visible rounded-xl bg-[var(--card-bg)] p-4 sm:p-5" style={cardStyle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--accent)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="h-4 w-4">
                <path d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1zM5.05 3.05a.75.75 0 011.06 0l1.062 1.06A.75.75 0 116.11 5.173L5.05 4.11a.75.75 0 010-1.06zm9.9 0a.75.75 0 010 1.06l-1.06 1.062a.75.75 0 01-1.062-1.061l1.061-1.06a.75.75 0 011.06 0zM10 7a3 3 0 100 6 3 3 0 000-6zm-6.25 3a.75.75 0 01-.75.75H1.5a.75.75 0 010-1.5H3a.75.75 0 01.75.75zm14.5 0a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5H17a.75.75 0 01.75.75zM7.11 14.89a.75.75 0 010 1.06l-1.06 1.06a.75.75 0 01-1.06-1.06l1.06-1.06a.75.75 0 011.06 0zm5.78 0a.75.75 0 011.06 0l1.06 1.06a.75.75 0 11-1.06 1.06l-1.06-1.06a.75.75 0 010-1.06zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight">{t("aiInsights")}</h2>
              <p className="text-[10px] text-[var(--secondary-text)]">{t("aiInsightsDesc")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {generatedAt && (
              <span className="text-[9px] text-[var(--secondary-text)]">
                {new Date(generatedAt).toLocaleString()}
              </span>
            )}
            <button
              onClick={generate}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "var(--accent)" }}
            >
              {loading ? (
                <>
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white" />
                  {t("aiGenerating")}
                </>
              ) : sections || rawText ? (
                t("aiRegenerate")
              ) : (
                t("aiGenerate")
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-[#ea4335]/20 bg-[#ea4335]/5 p-3 text-[11px] text-[#ea4335]">{error}</div>
        )}

        {!sections && !rawText && !loading && !error && (
          <div className="mt-6 flex flex-col items-center py-10 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: "rgba(67,160,71,0.1)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="var(--accent)" className="h-5 w-5">
                <path d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1zM5.05 3.05a.75.75 0 011.06 0l1.062 1.06A.75.75 0 116.11 5.173L5.05 4.11a.75.75 0 010-1.06zm9.9 0a.75.75 0 010 1.06l-1.06 1.062a.75.75 0 01-1.062-1.061l1.061-1.06a.75.75 0 011.06 0zM10 7a3 3 0 100 6 3 3 0 000-6z" />
              </svg>
            </div>
            <p className="text-xs text-[var(--secondary-text)]">{t("aiPlaceholder")}</p>
          </div>
        )}

        {loading && (
          <div className="mt-6 flex flex-col items-center py-12 text-center">
            <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
            <p className="text-xs text-[var(--secondary-text)]">{t("aiAnalyzing")}</p>
            <p className="mt-1 text-[10px] text-[var(--secondary-text)] opacity-60">{t("aiAnalyzingNote")}</p>
          </div>
        )}

        {rawText && (
          <div className="mt-4 rounded-lg p-4 text-[11px] whitespace-pre-wrap" style={subCardStyle}>{rawText}</div>
        )}

        {sections && (
          <div className="mt-4 space-y-3">
            {sections.map((section) => (
              <div key={section.id} className="overflow-hidden rounded-lg" style={{ ...subCardStyle, border: "1px solid var(--border)" }}>
                <button
                  onClick={() => toggleSection(section.id)}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-[var(--border)]/10"
                >
                  <span className="text-[12px] font-semibold">{section.title}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className={`h-3.5 w-3.5 text-[var(--secondary-text)] transition-transform ${expanded[section.id] ? "rotate-180" : ""}`}
                  >
                    <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 011.06 0L8 8.94l2.72-2.72a.75.75 0 111.06 1.06l-3.25 3.25a.75.75 0 01-1.06 0L4.22 7.28a.75.75 0 010-1.06z" clipRule="evenodd" />
                  </svg>
                </button>
                {expanded[section.id] && (
                  <div className="border-t border-[var(--border)]/50 px-3 py-3">
                    {renderSection(section)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
