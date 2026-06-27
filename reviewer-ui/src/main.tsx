import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  X,
  ClipboardList,
  Copy,
  Database,
  ExternalLink,
  FileSearch,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Truck
} from "lucide-react";
import { analyzeCase, datasetDashboardUrl, fetchCases, imageUrl } from "./api";
import type { AnalysisResult, GalleryImage, ReviewCase, SignalResult } from "./types";
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
          {selected && selectedAnalysis ? <AnalysisPanel analysis={selectedAnalysis} reviewCase={selected} /> : <PreAnalysis />}
        </aside>
      </main>
    </div>
  );
}

function CaseFile({ reviewCase }: { reviewCase: ReviewCase }) {
  const image = reviewCase.primaryImage;
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const galleryImages = reviewCase.galleryImages.length
    ? reviewCase.galleryImages
    : image
      ? [{
        id: image.image_id,
        filename: image.filename,
        label: "Current claim evidence",
        source: "claim" as const,
        kind: "claim" as const,
        metadata_status: image.metadata_status,
        capture_context: image.capture_context
      }]
      : [];

  useEffect(() => {
    setGalleryIndex(null);
  }, [reviewCase.id]);

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
        <button className="imageFrame imageButton" type="button" onClick={() => galleryImages.length && setGalleryIndex(0)}>
          {image ? <img src={imageUrl(image.filename)} alt={image.filename} /> : <div>No image</div>}
          {galleryImages.length ? <span className="imageHint">Open evidence gallery · {galleryImages.length} image{galleryImages.length === 1 ? "" : "s"}</span> : null}
        </button>
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

      {galleryIndex !== null && galleryImages[galleryIndex] ? (
        <ImageLightbox
          images={galleryImages}
          index={galleryIndex}
          onIndexChange={setGalleryIndex}
          onClose={() => setGalleryIndex(null)}
        />
      ) : null}
    </div>
  );
}

function ImageLightbox({
  images,
  index,
  onIndexChange,
  onClose
}: {
  images: GalleryImage[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const active = images[index];
  const previous = () => onIndexChange((index - 1 + images.length) % images.length);
  const next = () => onIndexChange((index + 1) % images.length);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") previous();
      if (event.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Evidence image viewer">
      <button className="lightboxBackdrop" type="button" onClick={onClose} aria-label="Close image viewer" />
      <div className="lightboxPanel">
        <div className="lightboxTop">
          <div>
            <strong>{active.label}</strong>
            <span>{active.filename}</span>
          </div>
          <button className="iconButton" type="button" onClick={onClose} aria-label="Close image viewer">
            <X size={18} />
          </button>
        </div>
        <div className="lightboxImageWrap">
          {images.length > 1 ? (
            <button className="navButton left" type="button" onClick={previous} aria-label="Previous image">
              <ChevronLeft size={22} />
            </button>
          ) : null}
          <img src={imageUrl(active.filename, active.kind)} alt={active.label} />
          {images.length > 1 ? (
            <button className="navButton right" type="button" onClick={next} aria-label="Next image">
              <ChevronRight size={22} />
            </button>
          ) : null}
        </div>
        <div className="lightboxMeta">
          <span>{index + 1} of {images.length}</span>
          <span>{active.source.replaceAll("_", " ")}</span>
          {active.metadata_status ? <span>{active.metadata_status}</span> : null}
          {active.capture_context ? <span>{active.capture_context.replaceAll("_", " ")}</span> : null}
        </div>
        {images.length > 1 ? (
          <div className="thumbStrip">
            {images.map((image, imageIndex) => (
              <button
                className={`thumb ${imageIndex === index ? "active" : ""}`}
                type="button"
                key={image.id}
                onClick={() => onIndexChange(imageIndex)}
                aria-label={`Open ${image.label}`}
              >
                <img src={imageUrl(image.filename, image.kind)} alt="" />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

interface ManualFallbackResult {
  score: number;
  finalRiskScore: number;
  finalRiskLevel: "Low" | "Elevated" | "High";
  recommendedAction: string;
  summary: string;
  parsed: Array<{ source: string; score: number | null; text: string }>;
}

function AnalysisPanel({ analysis, reviewCase }: { analysis: AnalysisResult; reviewCase: ReviewCase }) {
  const [manualResult, setManualResult] = useState<ManualFallbackResult | null>(null);
  const displayed = manualResult
    ? {
      finalRiskScore: manualResult.finalRiskScore,
      finalRiskLevel: manualResult.finalRiskLevel,
      recommendedAction: manualResult.recommendedAction,
      summary: manualResult.summary
    }
    : analysis;

  return (
    <div>
      <div className={`riskCard ${displayed.finalRiskLevel.toLowerCase()}`}>
        <div>
          <div className="sectionLabel">Final Risk</div>
          <strong>{displayed.finalRiskLevel}</strong>
        </div>
        <div className="scoreRing">{displayed.finalRiskScore}</div>
      </div>
      <div className="actionCard">
        <ShieldAlert size={18} />
        <div>
          <strong>{displayed.recommendedAction}</strong>
          <p>{displayed.summary}</p>
        </div>
      </div>
      {manualResult ? (
        <div className="manualApplied">
          Manual external fallback applied. This is reviewer-supplied context and has higher priority than Sightengine for this displayed recommendation.
        </div>
      ) : null}
      {analysis.guardrailsApplied.length ? (
        <div className="guardrails">
          {analysis.guardrailsApplied.map((item) => <div key={item}>{item}</div>)}
        </div>
      ) : null}
      <div className="signalStack">
        {analysis.signals.map((signal) => <SignalCard key={signal.key} signal={signal} />)}
      </div>
      <ManualAiCheck reviewCase={reviewCase} baseAnalysis={analysis} onApply={setManualResult} />
    </div>
  );
}

function ManualAiCheck({
  reviewCase,
  baseAnalysis,
  onApply
}: {
  reviewCase: ReviewCase;
  baseAnalysis: AnalysisResult;
  onApply: (result: ManualFallbackResult | null) => void;
}) {
  const [chatgptResult, setChatgptResult] = useState("");
  const [geminiResult, setGeminiResult] = useState("");
  const [copied, setCopied] = useState(false);
  const image = reviewCase.primaryImage;
  const prompt = manualPrompt(reviewCase);

  function copyPrompt() {
    navigator.clipboard.writeText(prompt)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      })
      .catch(() => setCopied(false));
  }

  function applyManualFallback() {
    const parsed = [
      { source: "ChatGPT", score: parseManualScore(chatgptResult), text: chatgptResult.trim() },
      { source: "Gemini", score: parseManualScore(geminiResult), text: geminiResult.trim() }
    ].filter((item) => item.text);

    if (!parsed.length) {
      onApply(null);
      return;
    }

    const numericScores = parsed.flatMap((item) => item.score === null ? [] : [item.score]);
    const score = numericScores.length
      ? Math.round(numericScores.reduce((sum, value) => sum + value, 0) / numericScores.length)
      : inferManualScore(parsed.map((item) => item.text).join(" "));
    const finalRiskScore = Math.max(baseAnalysis.finalRiskScore, score >= 75 ? 78 : score >= 45 ? 52 : baseAnalysis.finalRiskScore);
    const finalRiskLevel = finalRiskScore >= 70 ? "High" : finalRiskScore >= 35 ? "Elevated" : "Low";
    const recommendedAction = finalRiskLevel === "High"
      ? "Escalate to integrity review"
      : score >= 45
        ? "Request more evidence"
        : baseAnalysis.recommendedAction;

    onApply({
      score,
      finalRiskScore,
      finalRiskLevel,
      recommendedAction,
      parsed,
      summary: `Manual external AI check score ${score}/100 applied as fallback. ${recommendedAction}.`
    });
  }

  return (
    <div className="manualCheck">
      <div className="manualHead">
        <div>
          <div className="sectionLabel">Final fallback</div>
          <strong>Manual AI Check</strong>
          <p>Use when automated signals are ambiguous. Open ChatGPT/Gemini, drag or upload the image, paste the prompt, then paste results back here.</p>
        </div>
      </div>

      <div className="manualButtons">
        <button type="button" onClick={() => window.open("https://chatgpt.com/", "_blank", "noopener,noreferrer")}>
          <ExternalLink size={15} />
          Open ChatGPT
        </button>
        <button type="button" onClick={() => window.open("https://gemini.google.com/app", "_blank", "noopener,noreferrer")}>
          <ExternalLink size={15} />
          Open Gemini
        </button>
        <button type="button" onClick={copyPrompt}>
          <Copy size={15} />
          {copied ? "Copied" : "Copy prompt"}
        </button>
        {image ? (
          <button type="button" onClick={() => window.open(imageUrl(image.filename), "_blank", "noopener,noreferrer")}>
            <ExternalLink size={15} />
            Open image
          </button>
        ) : null}
      </div>

      <div className="manualPrompt">
        <div className="sectionLabel">Prompt</div>
        <pre>{prompt}</pre>
      </div>

      {image ? (
        <div className="manualImage">
          <img src={imageUrl(image.filename)} alt={image.filename} draggable />
          <span>Drag this image into ChatGPT or Gemini, or use Open image.</span>
        </div>
      ) : null}

      <textarea value={chatgptResult} onChange={(event) => setChatgptResult(event.target.value)} placeholder="Paste ChatGPT result..." />
      <textarea value={geminiResult} onChange={(event) => setGeminiResult(event.target.value)} placeholder="Paste Gemini result..." />

      <div className="manualButtons">
        <button type="button" className="applyManual" onClick={applyManualFallback}>Apply manual fallback</button>
        <button type="button" onClick={() => { setChatgptResult(""); setGeminiResult(""); onApply(null); }}>Clear</button>
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
        <small>{confidenceLabel(signal)}</small>
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

function confidenceLabel(signal: SignalResult) {
  if (signal.status === "not_configured") return "not run";
  if (signal.status === "error") return "excluded from score";
  if (signal.confidence === null) return "confidence not reported";
  if (signal.key === "sightengine") return "detector result returned";
  return `${Math.round(signal.confidence * 100)}% model confidence`;
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

function manualPrompt(reviewCase: ReviewCase) {
  return [
    "Check confidence of this image being AI-generated or AI-edited.",
    "Inspect only the visible image content. Do not rely on metadata.",
    "Return:",
    "1. AI-generated or AI-edited confidence from 0-100%",
    "2. Short reasoning",
    "3. Visible cues that support or weaken the conclusion",
    "4. Limitations or uncertainty",
    "",
    `Context: This is refund claim evidence for ${reviewCase.product.name}.`,
    `Buyer claim: ${reviewCase.claim.refund_request_description}`
  ].join("\n");
}

function parseManualScore(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const percentMatches = [...trimmed.matchAll(/(\d{1,3}(?:\.\d+)?)\s*%/g)]
    .map((match) => Number(match[1]))
    .filter((value) => Number.isFinite(value) && value >= 0 && value <= 100);
  if (percentMatches.length) return Math.round(Math.max(...percentMatches));

  const decimalMatch = trimmed.match(/\b0\.(\d{1,2})\b/);
  if (decimalMatch) return Math.round(Number(decimalMatch[0]) * 100);

  return null;
}

function inferManualScore(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes("very high") || lower.includes("high confidence") || lower.includes("likely ai") || lower.includes("strong signs")) return 80;
  if (lower.includes("medium") || lower.includes("moderate") || lower.includes("uncertain") || lower.includes("mixed")) return 55;
  if (lower.includes("low confidence") || lower.includes("unlikely") || lower.includes("no obvious")) return 25;
  return 50;
}

createRoot(document.getElementById("root")!).render(<App />);
