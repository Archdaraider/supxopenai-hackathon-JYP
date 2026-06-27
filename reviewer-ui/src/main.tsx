import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  BadgeCheck,
  ClipboardList,
  Database,
  FileSearch,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Truck
} from "lucide-react";
import { analyzeCase, datasetDashboardUrl, fetchCases, imageUrl } from "./api";
import type { AnalysisResult, ReviewCase, SignalResult } from "./types";
import "./styles.css";

type CaseWithAnalysis = ReviewCase;

function App() {
  const [cases, setCases] = useState<CaseWithAnalysis[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [analysisByCase, setAnalysisByCase] = useState<Record<string, AnalysisResult>>({});
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCases()
      .then((loaded) => {
        setCases(loaded);
        setSelectedId(loaded[0]?.id ?? null);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load cases"))
      .finally(() => setLoading(false));
  }, []);

  const selected = useMemo(() => cases.find((item) => item.id === selectedId) ?? cases[0], [cases, selectedId]);
  const selectedAnalysis = selected ? analysisByCase[selected.id] : null;

  async function runAnalysis() {
    if (!selected) return;
    setAnalyzing(true);
    setError(null);
    try {
      const analysis = await analyzeCase(selected.id);
      setAnalysisByCase((current) => ({ ...current, [selected.id]: analysis }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <div className="eyebrow">Carousell Trust & Safety</div>
          <h1>Refund Claim Reviewer</h1>
        </div>
        <div className="topActions">
          <a className="ghostLink" href={datasetDashboardUrl} target="_blank" rel="noreferrer">
            <Database size={16} />
            Dataset Viewer
          </a>
          <div className="runState">
            {selectedAnalysis ? `Last analyzed ${new Date(selectedAnalysis.generatedAt).toLocaleTimeString()}` : "Analysis not run"}
          </div>
        </div>
      </header>

      {error ? <div className="errorBanner">{error}</div> : null}

      <main className="workspace">
        <aside className="queue panel">
          <div className="panelHeader">
            <div>
              <div className="sectionLabel">Escalated Cases</div>
              <strong>{loading ? "Loading..." : `${cases.length} disputes`}</strong>
            </div>
          </div>
          <div className="caseList">
            {cases.map((item) => {
              const analysis = analysisByCase[item.id];
              return (
                <button
                  key={item.id}
                  className={`caseRow ${item.id === selected?.id ? "active" : ""}`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <div className="caseRowTop">
                    <span>{item.id}</span>
                    {analysis ? <RiskPill level={analysis.finalRiskLevel} /> : <span className="statusPill">Ready</span>}
                  </div>
                  <div className="caseTitle">{item.product.name}</div>
                  <div className="caseMeta">{item.buyer.user_profile_badge} · S${item.order.refund_amount_requested_sgd}</div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="caseFile panel">
          {selected ? <CaseFile reviewCase={selected} /> : <EmptyState />}
        </section>

        <aside className="analysis panel">
          <div className="analysisHeader">
            <div>
              <div className="sectionLabel">Reviewer Decision Support</div>
              <strong>Legitimacy Analysis</strong>
            </div>
            <button className="primaryButton" onClick={runAnalysis} disabled={!selected || analyzing}>
              {analyzing ? <Loader2 className="spin" size={16} /> : <FileSearch size={16} />}
              Run analysis
            </button>
          </div>
          {selectedAnalysis ? <AnalysisPanel analysis={selectedAnalysis} /> : <PreAnalysis />}
        </aside>
      </main>
    </div>
  );
}

function CaseFile({ reviewCase }: { reviewCase: ReviewCase }) {
  const image = reviewCase.primaryImage;
  return (
    <div>
      <div className="caseHero">
        <div>
          <div className="chips">
            <span className="chip">{reviewCase.buyer.user_profile_badge}</span>
            <span className="chip">{reviewCase.seller.user_profile_badge}</span>
            <span className="chip">{reviewCase.order.programme}</span>
          </div>
          <h2>{reviewCase.product.name}</h2>
          <p>{reviewCase.escalationSummary}</p>
        </div>
        <div className="refundBox">
          <span>Refund requested</span>
          <strong>S${reviewCase.order.refund_amount_requested_sgd}</strong>
          <small>{reviewCase.order.refund_type_requested.replaceAll("_", " ")}</small>
        </div>
      </div>

      <div className="evidenceGrid">
        <div className="imageFrame">
          {image ? <img src={imageUrl(image.filename)} alt={image.filename} /> : <div>No image</div>}
        </div>
        <div className="claimCard">
          <div className="sectionLabel">Buyer Claim</div>
          <p>{reviewCase.claim.refund_request_description}</p>
          <div className="sectionLabel">Seller Response</div>
          <p>{reviewCase.sellerResponse}</p>
        </div>
      </div>

      <div className="factsGrid">
        <Fact title="Buyer" value={reviewCase.buyer.display_name} detail={`${reviewCase.buyer.total_orders} orders · ${reviewCase.buyer.total_refunds} refunds`} />
        <Fact title="Buyer history" value={`${reviewCase.buyer.account_age_days} days old`} detail={`${reviewCase.buyer.claims_last_30_days} claims in 30d`} />
        <Fact title="Seller" value={reviewCase.seller.display_name} detail={`${reviewCase.seller.disputes_last_90d} disputes in 90d`} />
        <Fact title="Product material" value={reviewCase.product.category} detail={reviewCase.product.material} />
      </div>

      <div className="timeline">
        {reviewCase.timeline.map((event) => (
          <div className="timelineItem" key={`${event.label}-${event.date}`}>
            <div className="timelineDot" />
            <div>
              <strong>{event.label}</strong>
              <span>{event.date}</span>
              <p>{event.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalysisPanel({ analysis }: { analysis: AnalysisResult }) {
  return (
    <div>
      <div className={`riskCard ${analysis.finalRiskLevel.toLowerCase()}`}>
        <div>
          <div className="sectionLabel">Final Risk</div>
          <strong>{analysis.finalRiskLevel}</strong>
        </div>
        <div className="scoreRing">{analysis.finalRiskScore}</div>
      </div>
      <div className="actionCard">
        <ShieldAlert size={18} />
        <div>
          <strong>{analysis.recommendedAction}</strong>
          <p>{analysis.summary}</p>
        </div>
      </div>
      {analysis.guardrailsApplied.length ? (
        <div className="guardrails">
          {analysis.guardrailsApplied.map((item) => <div key={item}>{item}</div>)}
        </div>
      ) : null}
      <div className="signalStack">
        {analysis.signals.map((signal) => <SignalCard key={signal.key} signal={signal} />)}
      </div>
    </div>
  );
}

function SignalCard({ signal }: { signal: SignalResult }) {
  const Icon = signal.key === "behavioural"
    ? ClipboardList
    : signal.key === "sightengine"
      ? Sparkles
      : signal.key === "physical_plausibility"
        ? Truck
        : ShieldCheck;

  return (
    <div className="signalCard">
      <div className="signalHead">
        <div className="signalTitle">
          <Icon size={17} />
          <strong>{signal.label}</strong>
        </div>
        <span className={`signalStatus ${signal.status}`}>{signal.status.replace("_", " ")}</span>
      </div>
      <div className="signalScore">
        <span>{signal.score === null ? "N/A" : signal.score}</span>
        <small>{signal.confidence === null ? "confidence unavailable" : `${Math.round(signal.confidence * 100)}% confidence`}</small>
      </div>
      <p>{signal.explanation}</p>
      <details>
        <summary>Evidence and limitations</summary>
        <ul>
          {signal.evidence.map((item) => <li key={item}>{item}</li>)}
          {signal.limitations.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </details>
    </div>
  );
}

function PreAnalysis() {
  return (
    <div className="preAnalysis">
      <AlertTriangle size={28} />
      <strong>No automated analysis yet</strong>
      <p>Click Run analysis to evaluate behavioural context, Sightengine AI image likelihood, physical plausibility, and evidence sufficiency.</p>
    </div>
  );
}

function EmptyState() {
  return <div className="preAnalysis">No case selected.</div>;
}

function RiskPill({ level }: { level: string }) {
  return <span className={`riskPill ${level.toLowerCase()}`}>{level}</span>;
}

function Fact({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <div className="fact">
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
