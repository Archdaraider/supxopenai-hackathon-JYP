import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock3,
  X,
  ClipboardList,
  Copy,
  Database,
  ExternalLink,
  FileSearch,
  Loader2,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Truck,
  XCircle
} from "lucide-react";
import { analyzeCase, datasetDashboardUrl, fetchCases, imageUrl } from "./api";
import type { AnalysisResult, GalleryImage, ReviewCase, RiskLevel, SignalResult } from "./types";
import "./styles.css";

type CaseWithAnalysis = ReviewCase;
type ViewMode = "dashboard" | "review";
type QueueFilter = "all" | "unanalysed" | "resubmission" | "time_sensitive" | "elevated" | "manual";

interface CaseActionLog {
  type: "request_evidence" | "approve_refund" | "reject_refund" | "open_buyer_chat" | "open_seller_chat";
  label: string;
  detail: string;
  createdAt: string;
}

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [cases, setCases] = useState<CaseWithAnalysis[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [queueFilter, setQueueFilter] = useState<QueueFilter>("all");
  const [analysisByCase, setAnalysisByCase] = useState<Record<string, AnalysisResult>>({});
  const [manualByCase, setManualByCase] = useState<Record<string, ManualFallbackResult | null>>({});
  const [actionLogByCase, setActionLogByCase] = useState<Record<string, CaseActionLog[]>>({});
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const analysisRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    fetchCases()
      .then((loaded) => {
        setCases(loaded);
        setSelectedId(loaded[0]?.id ?? null);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load cases"))
      .finally(() => setLoading(false));
  }, []);

  const displayedCases = useMemo(
    () => cases.filter((item, index) => matchesQueueFilter(item, index, queueFilter, analysisByCase, manualByCase, actionLogByCase)),
    [cases, queueFilter, analysisByCase, manualByCase, actionLogByCase]
  );
  const selected = useMemo(() => {
    const source = viewMode === "review" && displayedCases.length ? displayedCases : cases;
    return source.find((item) => item.id === selectedId) ?? source[0];
  }, [cases, displayedCases, selectedId, viewMode]);
  const selectedAnalysis = selected ? analysisByCase[selected.id] : null;
  const selectedManual = selected ? manualByCase[selected.id] : null;

  useEffect(() => {
    if (viewMode !== "review") return;
    if (!displayedCases.length) {
      setSelectedId(null);
      return;
    }
    if (!displayedCases.some((item) => item.id === selectedId)) {
      setSelectedId(displayedCases[0].id);
    }
  }, [displayedCases, selectedId, viewMode]);

  if (!authenticated) return <LoginScreen onLogin={() => setAuthenticated(true)} />;

  function openReview(filter: QueueFilter = "all", caseId?: string) {
    setQueueFilter(filter);
    if (caseId) setSelectedId(caseId);
    setViewMode("review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function recordAction(caseId: string, action: CaseActionLog) {
    setActionLogByCase((current) => ({
      ...current,
      [caseId]: [action, ...(current[caseId] ?? [])].slice(0, 6)
    }));
  }

  async function runAnalysis() {
    if (!selected) return;
    setAnalyzing(true);
    setError(null);
    try {
      const analysis = await analyzeCase(selected.id);
      setAnalysisByCase((current) => ({ ...current, [selected.id]: analysis }));
      setManualByCase((current) => ({ ...current, [selected.id]: null }));
      window.setTimeout(() => analysisRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
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
          <h1>Claim Integrity Agent <span>by PJAY</span></h1>
        </div>
        <div className="topActions">
          {viewMode === "review" ? (
            <button className="ghostButton" type="button" onClick={() => setViewMode("dashboard")}>
              <ArrowLeft size={16} />
              Dashboard
            </button>
          ) : null}
          <a className="ghostLink" href={datasetDashboardUrl} target="_blank" rel="noreferrer">
            <Database size={16} />
            Dataset Viewer
          </a>
          <div className="runState">
            {selectedManual ? "Manual fallback applied" : selectedAnalysis ? `Last analyzed ${new Date(selectedAnalysis.generatedAt).toLocaleTimeString()}` : "Analysis not run"}
          </div>
        </div>
      </header>

      {error ? <div className="errorBanner">{error}</div> : null}

      {viewMode === "dashboard" ? (
        <OperationsDashboard
          cases={cases}
          loading={loading}
          analysisByCase={analysisByCase}
          manualByCase={manualByCase}
          actionLogByCase={actionLogByCase}
          onOpenReview={openReview}
        />
      ) : (
      <main className="workspace">
        <div className="reviewToolbar">
          <div>
            <div className="sectionLabel">Case Review</div>
            <strong>{queueTitle(queueFilter)}</strong>
            <span>{displayedCases.length} case{displayedCases.length === 1 ? "" : "s"} in this view</span>
          </div>
          <button className="ghostButton" type="button" onClick={() => openReview("all")}>Clear filter</button>
        </div>
        <div className="topWorkspace">
          <aside className="queue panel">
            <div className="panelHeader">
              <div>
                <div className="sectionLabel">Escalated Cases</div>
                <strong>{loading ? "Loading..." : `${displayedCases.length} disputes`}</strong>
              </div>
            </div>
            <div className="caseList">
              {displayedCases.map((item) => {
                const manual = manualByCase[item.id];
                const analysis = analysisByCase[item.id];
                const visibleRisk = manual?.finalRiskLevel || analysis?.finalRiskLevel;
                return (
                  <button
                    key={item.id}
                    className={`caseRow ${item.id === selected?.id ? "active" : ""}`}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <div className="caseRowTop">
                      <span>{item.id}</span>
                      {visibleRisk ? <RiskPill level={visibleRisk} /> : <span className="statusPill">Ready</span>}
                    </div>
                    <div className="caseTitle">{item.product.name}</div>
                    <div className="caseMeta">{item.buyer.user_profile_badge} · S${item.order.refund_amount_requested_sgd}{manual ? " · manual fallback" : ""}</div>
                  </button>
                );
              })}
              {!displayedCases.length ? <div className="queueEmpty">No cases match this queue.</div> : null}
            </div>
          </aside>

          <section className="caseFile panel">
            {selected ? <CaseFile reviewCase={selected} /> : <EmptyState />}
          </section>
        </div>

        <section className="analysis panel" ref={analysisRef}>
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
          {selected && selectedAnalysis ? (
            <AnalysisPanel
              analysis={selectedAnalysis}
              reviewCase={selected}
              manualResult={selectedManual || null}
              onManualApply={(result) => {
                setManualByCase((current) => ({ ...current, [selected.id]: result }));
                window.setTimeout(() => analysisRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
              }}
              actionLog={actionLogByCase[selected.id] ?? []}
              onAction={(action) => recordAction(selected.id, action)}
            />
          ) : <PreAnalysis />}
        </section>
      </main>
      )}
    </div>
  );
}

function OperationsDashboard({
  cases,
  loading,
  analysisByCase,
  manualByCase,
  actionLogByCase,
  onOpenReview
}: {
  cases: ReviewCase[];
  loading: boolean;
  analysisByCase: Record<string, AnalysisResult>;
  manualByCase: Record<string, ManualFallbackResult | null>;
  actionLogByCase: Record<string, CaseActionLog[]>;
  onOpenReview: (filter?: QueueFilter, caseId?: string) => void;
}) {
  const metrics = useMemo(
    () => buildDashboardMetrics(cases, analysisByCase, manualByCase, actionLogByCase),
    [cases, analysisByCase, manualByCase, actionLogByCase]
  );
  const priorityCases = useMemo(
    () => cases
      .map((item, index) => ({ item, index, score: priorityScore(item, index, analysisByCase, manualByCase, actionLogByCase) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5),
    [cases, analysisByCase, manualByCase, actionLogByCase]
  );

  return (
    <main className="opsDashboard">
      <section className="opsHero panel">
        <div>
          <div className="sectionLabel">Reviewer queue</div>
          <h2>Operations dashboard</h2>
          <p>Presentation queue for escalated Carousell refund disputes. Metrics are computed from the local test dataset and frontend demo state.</p>
        </div>
        <button className="startReviewButton" type="button" onClick={() => onOpenReview("all")}>
          <FileSearch size={19} />
          Start case review
        </button>
      </section>

      <section className="opsCards" aria-label="Queue metrics">
        <MetricCard
          icon={<ClipboardList size={24} />}
          label="Tickets left for analysis"
          value={loading ? "..." : metrics.unanalysed}
          detail="No live analysis run yet"
          tone="dark"
          onClick={() => onOpenReview("unanalysed")}
        />
        <MetricCard
          icon={<RefreshCw size={24} />}
          label="Ready for re-submission"
          value={loading ? "..." : metrics.resubmission}
          detail="Buyer supplied or likely needs more evidence"
          tone="green"
          onClick={() => onOpenReview("resubmission")}
        />
        <MetricCard
          icon={<Clock3 size={24} />}
          label="Time sensitive"
          value={loading ? "..." : metrics.timeSensitive}
          detail="Demo queue over 7 unresolved days"
          tone="amber"
          onClick={() => onOpenReview("time_sensitive")}
        />
        <MetricCard
          icon={<ShieldAlert size={24} />}
          label="Elevated review queue"
          value={loading ? "..." : metrics.elevated}
          detail="Higher risk or uncertain decision support"
          tone="red"
          onClick={() => onOpenReview("elevated")}
        />
        <MetricCard
          icon={<Sparkles size={24} />}
          label="Manual fallback needed"
          value={loading ? "..." : metrics.manual}
          detail="AI-image ambiguity needs reviewer check"
          tone="blue"
          onClick={() => onOpenReview("manual")}
        />
      </section>

      <section className="opsLower">
        <div className="panel priorityPanel">
          <div className="panelHeader">
            <div>
              <div className="sectionLabel">Priority Queue</div>
              <strong>Suggested next tickets</strong>
            </div>
            <button className="ghostButton" type="button" onClick={() => onOpenReview("all")}>View all</button>
          </div>
          <div className="priorityList">
            {priorityCases.map(({ item, index }) => {
              const visibleRisk = manualByCase[item.id]?.finalRiskLevel || analysisByCase[item.id]?.finalRiskLevel;
              return (
                <button className="priorityRow" type="button" key={item.id} onClick={() => onOpenReview("all", item.id)}>
                  <div className="priorityImage">
                    {item.primaryImage ? <img src={imageUrl(item.primaryImage.filename)} alt="" /> : <BarChart3 size={18} />}
                  </div>
                  <div>
                    <strong>{item.product.name}</strong>
                    <span>{item.buyer.display_name} vs {item.seller.display_name}</span>
                    <small>{dashboardReason(item, index, analysisByCase, manualByCase, actionLogByCase)}</small>
                  </div>
                  {visibleRisk ? <RiskPill level={visibleRisk} /> : <span className="statusPill">Ready</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="panel opsNotes">
          <div className="sectionLabel">Today</div>
          <strong>Reviewer focus</strong>
          <div className="focusList">
            <div><CheckCircle2 size={17} /><span>Run analysis before making a refund decision.</span></div>
            <div><MessageSquare size={17} /><span>Use CTA buttons to show buyer or seller follow-up flow.</span></div>
            <div><AlertTriangle size={17} /><span>Manual fallback is reserved for ambiguous AI-image signals.</span></div>
          </div>
        </div>
      </section>
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
  tone,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  detail: string;
  tone: "dark" | "green" | "amber" | "red" | "blue";
  onClick: () => void;
}) {
  return (
    <button className={`metricCard ${tone}`} type="button" onClick={onClick}>
      <span className="metricIcon">{icon}</span>
      <strong>{value}</strong>
      <span>{label}</span>
      <small>{detail}</small>
    </button>
  );
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [reviewerId, setReviewerId] = useState("reviewer@carousell.demo");
  const [passcode, setPasscode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setVerifying(true);
    window.setTimeout(() => {
      setVerifying(false);
      setVerified(true);
      window.setTimeout(onLogin, 520);
    }, 760);
  }

  return (
    <main className="loginPage">
      <div className="loginBackdrop" />
      <section className="loginShell" aria-label="Carousell reviewer login">
        <div className="loginNarrative">
          <div className="loginBadge">Carousell reviewer access</div>
          <h1>Making secondhand the first choice</h1>
          <div className="loginProductTitle">
            <strong>Claim Integrity Agent</strong>
            <span>by PJAY</span>
          </div>
          <p>Reviewer tools for checking buyer claims, seller context, evidence images, AI-image signals, and manual fallback notes from one controlled workspace.</p>
          <div className="loginMetrics">
            <div><strong>22</strong><span>test disputes</span></div>
            <div><strong>4</strong><span>signal groups</span></div>
            <div><strong>0</strong><span>auto rejections</span></div>
          </div>
        </div>

        <form className="loginCard" onSubmit={submit}>
          <div className="loginCardTop">
            <div>
              <span>Reviewer portal</span>
              <strong>Demo sign in</strong>
            </div>
            <div className="loginStatus">{verified ? "Verified" : verifying ? "Checking" : "Local demo"}</div>
          </div>

          <label>
            Reviewer ID
            <input value={reviewerId} onChange={(event) => setReviewerId(event.target.value)} />
          </label>
          <label>
            Verification code
            <input value={passcode} onChange={(event) => setPasscode(event.target.value)} placeholder="Any code works" />
          </label>

          <button className="loginButton" type="submit" disabled={verifying}>
            {verifying ? <Loader2 className="spin" size={18} /> : <ShieldCheck size={18} />}
            {verified ? "Opening workspace" : verifying ? "Verifying reviewer" : "Verify and continue"}
          </button>

          <div className="loginFineprint">
            Dummy verification for presentation. No external authentication is called.
          </div>
        </form>
      </section>
    </main>
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

function AnalysisPanel({
  analysis,
  reviewCase,
  manualResult,
  onManualApply,
  actionLog,
  onAction
}: {
  analysis: AnalysisResult;
  reviewCase: ReviewCase;
  manualResult: ManualFallbackResult | null;
  onManualApply: (result: ManualFallbackResult | null) => void;
  actionLog: CaseActionLog[];
  onAction: (action: CaseActionLog) => void;
}) {
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
      <ManualAiCheck reviewCase={reviewCase} baseAnalysis={analysis} onApply={onManualApply} />
      <ReviewerDecisionActions
        reviewCase={reviewCase}
        finalRiskLevel={displayed.finalRiskLevel}
        actionLog={actionLog}
        onAction={onAction}
      />
    </div>
  );
}

function ReviewerDecisionActions({
  reviewCase,
  finalRiskLevel,
  actionLog,
  onAction
}: {
  reviewCase: ReviewCase;
  finalRiskLevel: RiskLevel;
  actionLog: CaseActionLog[];
  onAction: (action: CaseActionLog) => void;
}) {
  const [rejectReason, setRejectReason] = useState("Damage not supported by submitted evidence");
  const [chatTarget, setChatTarget] = useState<"buyer" | "seller" | null>(null);
  const reasons = [
    "Damage not supported by submitted evidence",
    "Item materially matches the listing",
    "Surface wear and tear does not affect functionality",
    "Issue appears outside the dispute window",
    "Claim concerns packaging only; item damage not shown",
    "Missing required return or evidence"
  ];

  function addAction(type: CaseActionLog["type"], label: string, detail: string) {
    onAction({ type, label, detail, createdAt: new Date().toISOString() });
  }

  function requestMoreEvidence() {
    setChatTarget("buyer");
    addAction(
      "request_evidence",
      "Requested more buyer evidence",
      "Opened buyer chat with a request for clearer damage photos, packaging photos, and short unboxing context."
    );
  }

  function approveRefund() {
    addAction(
      "approve_refund",
      "Approved refund",
      `Seller notification queued for S$${reviewCase.order.refund_amount_requested_sgd}.`
    );
  }

  function rejectRefund() {
    addAction("reject_refund", "Rejected refund with reason", rejectReason);
  }

  function openSellerChat() {
    setChatTarget("seller");
    addAction("open_seller_chat", "Opened seller chat", "Prepared seller follow-up message for dispute context.");
  }

  return (
    <div className="decisionPanel">
      <div className="decisionTop">
        <div>
          <div className="sectionLabel">Final reviewer step</div>
          <strong>Choose dispute outcome</strong>
          <p>Record the reviewer decision or open the relevant chat follow-up for this escalated refund claim.</p>
        </div>
        <RiskPill level={finalRiskLevel} />
      </div>

      <div className="decisionGrid">
        <button type="button" className="evidenceDecision" onClick={requestMoreEvidence}>
          <MessageSquare size={18} />
          Request buyer evidence
        </button>
        <button type="button" className="approveDecision" onClick={approveRefund}>
          <CheckCircle2 size={18} />
          Approve refund
        </button>
        <div className="rejectDecision">
          <select value={rejectReason} onChange={(event) => setRejectReason(event.target.value)}>
            {reasons.map((reason) => <option key={reason}>{reason}</option>)}
          </select>
          <button type="button" onClick={rejectRefund}>
            <XCircle size={18} />
            Reject with selected reason
          </button>
        </div>
        <button type="button" className="sellerDecision" onClick={openSellerChat}>
          <MessageSquare size={18} />
          Message seller
        </button>
      </div>

      {chatTarget ? (
        <div className="chatComposer">
          <div>
            <strong>{chatTarget === "buyer" ? `Buyer chat: ${reviewCase.buyer.display_name}` : `Seller chat: ${reviewCase.seller.display_name}`}</strong>
            <button type="button" onClick={() => setChatTarget(null)}>Close</button>
          </div>
          <textarea
            readOnly
            value={chatTarget === "buyer"
              ? `Hi ${reviewCase.buyer.display_name}, thanks for escalating this refund claim. To complete review, please send: 1) a wider photo of the item, 2) close-up of the crack or chip, 3) packaging condition, and 4) when the damage was first noticed.`
              : `Hi ${reviewCase.seller.display_name}, we are reviewing the buyer's claim for ${reviewCase.product.name}. Please share any packing photos, pre-shipment condition evidence, or context that helps assess the reported damage.`}
          />
        </div>
      ) : null}

      {actionLog.length ? (
        <div className="actionLog">
          {actionLog.map((entry) => (
            <div key={`${entry.createdAt}-${entry.label}`}>
              <strong>{entry.label}</strong>
              <span>{new Date(entry.createdAt).toLocaleTimeString()} · {entry.detail}</span>
            </div>
          ))}
        </div>
      ) : null}
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
  const [imageCopied, setImageCopied] = useState(false);
  const image = reviewCase.primaryImage;
  const prompt = manualPrompt(reviewCase);

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      })
      .catch(() => setCopied(false));
  }

  async function openManualCheck() {
    await copyPrompt();
    openSideBySideVerifierWindows();
  }

  async function copyImage() {
    if (!image) return;
    try {
      const response = await fetch(imageUrl(image.filename));
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type || "image/jpeg"]: blob })
      ]);
      setImageCopied(true);
      window.setTimeout(() => setImageCopied(false), 1600);
    } catch {
      window.open(imageUrl(image.filename), "_blank", "noopener,noreferrer");
    }
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
          <p>Use when automated signals are ambiguous. One click opens ChatGPT and Gemini and copies the prompt; paste their outputs back here.</p>
        </div>
      </div>

      <div className="manualButtons">
        <button type="button" className="launchManual" onClick={openManualCheck}>
          <ExternalLink size={15} />
          Open ChatGPT + Gemini
        </button>
        <button type="button" onClick={copyPrompt}>
          <Copy size={15} />
          {copied ? "Copied" : "Copy prompt"}
        </button>
        {image ? (
          <button type="button" onClick={copyImage}>
            <Copy size={15} />
            {imageCopied ? "Image copied" : "Copy image"}
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

      <div className="manualInputs">
        <textarea value={chatgptResult} onChange={(event) => setChatgptResult(event.target.value)} placeholder="Paste ChatGPT result..." />
        <textarea value={geminiResult} onChange={(event) => setGeminiResult(event.target.value)} placeholder="Paste Gemini result..." />
      </div>

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

function buildDashboardMetrics(
  cases: ReviewCase[],
  analysisByCase: Record<string, AnalysisResult>,
  manualByCase: Record<string, ManualFallbackResult | null>,
  actionLogByCase: Record<string, CaseActionLog[]>
) {
  return {
    unanalysed: cases.filter((item, index) => matchesQueueFilter(item, index, "unanalysed", analysisByCase, manualByCase, actionLogByCase)).length,
    resubmission: cases.filter((item, index) => matchesQueueFilter(item, index, "resubmission", analysisByCase, manualByCase, actionLogByCase)).length,
    timeSensitive: cases.filter((item, index) => matchesQueueFilter(item, index, "time_sensitive", analysisByCase, manualByCase, actionLogByCase)).length,
    elevated: cases.filter((item, index) => matchesQueueFilter(item, index, "elevated", analysisByCase, manualByCase, actionLogByCase)).length,
    manual: cases.filter((item, index) => matchesQueueFilter(item, index, "manual", analysisByCase, manualByCase, actionLogByCase)).length
  };
}

function matchesQueueFilter(
  reviewCase: ReviewCase,
  index: number,
  filter: QueueFilter,
  analysisByCase: Record<string, AnalysisResult>,
  manualByCase: Record<string, ManualFallbackResult | null>,
  actionLogByCase: Record<string, CaseActionLog[]>
) {
  if (filter === "all") return true;
  if (filter === "unanalysed") return !analysisByCase[reviewCase.id];
  if (filter === "resubmission") return isReadyForResubmission(reviewCase, index, actionLogByCase[reviewCase.id] ?? []);
  if (filter === "time_sensitive") return demoDaysOpen(reviewCase, index) > 7 && !hasFinalDecision(actionLogByCase[reviewCase.id] ?? []);
  if (filter === "elevated") return visibleRiskLevel(reviewCase.id, analysisByCase, manualByCase) !== "Low" || behaviouralPressure(reviewCase) >= 2;
  if (filter === "manual") return needsManualFallback(reviewCase, index, analysisByCase);
  return true;
}

function queueTitle(filter: QueueFilter) {
  const titles: Record<QueueFilter, string> = {
    all: "All escalated disputes",
    unanalysed: "Tickets left for analysis",
    resubmission: "Ready for re-submission",
    time_sensitive: "Time-sensitive tickets",
    elevated: "Elevated review queue",
    manual: "Manual fallback needed"
  };
  return titles[filter];
}

function priorityScore(
  reviewCase: ReviewCase,
  index: number,
  analysisByCase: Record<string, AnalysisResult>,
  manualByCase: Record<string, ManualFallbackResult | null>,
  actionLogByCase: Record<string, CaseActionLog[]>
) {
  const risk = visibleRiskLevel(reviewCase.id, analysisByCase, manualByCase);
  return (
    (risk === "High" ? 80 : risk === "Elevated" ? 48 : 18) +
    behaviouralPressure(reviewCase) * 14 +
    (demoDaysOpen(reviewCase, index) > 7 ? 28 : 0) +
    (needsManualFallback(reviewCase, index, analysisByCase) ? 16 : 0) +
    (isReadyForResubmission(reviewCase, index, actionLogByCase[reviewCase.id] ?? []) ? 10 : 0)
  );
}

function dashboardReason(
  reviewCase: ReviewCase,
  index: number,
  analysisByCase: Record<string, AnalysisResult>,
  manualByCase: Record<string, ManualFallbackResult | null>,
  actionLogByCase: Record<string, CaseActionLog[]>
) {
  const risk = visibleRiskLevel(reviewCase.id, analysisByCase, manualByCase);
  if (risk === "High" || risk === "Elevated") return `${risk} risk after analysis`;
  if (demoDaysOpen(reviewCase, index) > 7) return `${demoDaysOpen(reviewCase, index)} days unresolved`;
  if (isReadyForResubmission(reviewCase, index, actionLogByCase[reviewCase.id] ?? [])) return "Ready for evidence follow-up";
  if (needsManualFallback(reviewCase, index, analysisByCase)) return "Manual AI-image fallback suggested";
  return "Ready for initial analysis";
}

function visibleRiskLevel(
  caseId: string,
  analysisByCase: Record<string, AnalysisResult>,
  manualByCase: Record<string, ManualFallbackResult | null>
): RiskLevel | null {
  return manualByCase[caseId]?.finalRiskLevel ?? analysisByCase[caseId]?.finalRiskLevel ?? null;
}

function behaviouralPressure(reviewCase: ReviewCase) {
  return [
    reviewCase.buyer.account_age_days < 30,
    reviewCase.buyer.claims_last_30_days >= 2,
    reviewCase.buyer.total_refunds >= 2,
    reviewCase.seller.disputes_last_90d >= 3,
    reviewCase.order.total_claims_against_order >= 2
  ].filter(Boolean).length;
}

function demoDaysOpen(reviewCase: ReviewCase, index: number) {
  const delivered = Date.parse(reviewCase.order.delivered_at);
  const realAge = Number.isFinite(delivered) ? Math.max(1, Math.floor((Date.now() - delivered) / 86_400_000)) : 1;
  return realAge + (index % 4 === 0 ? 8 : index % 3);
}

function isReadyForResubmission(reviewCase: ReviewCase, index: number, actions: CaseActionLog[]) {
  const text = `${reviewCase.claim.refund_request_description} ${reviewCase.sellerResponse}`.toLowerCase();
  return actions.some((action) => action.type === "request_evidence") ||
    text.includes("additional") ||
    text.includes("packag") ||
    reviewCase.order.total_claims_against_order >= 3 ||
    index % 5 === 1;
}

function hasFinalDecision(actions: CaseActionLog[]) {
  return actions.some((action) => action.type === "approve_refund" || action.type === "reject_refund");
}

function needsManualFallback(
  reviewCase: ReviewCase,
  index: number,
  analysisByCase: Record<string, AnalysisResult>
) {
  const analysis = analysisByCase[reviewCase.id];
  const sightengine = analysis?.signals.find((signal) => signal.key === "sightengine");
  const physical = analysis?.signals.find((signal) => signal.key === "physical_plausibility");
  if (sightengine?.score !== null && sightengine?.score !== undefined && physical?.score !== null && physical?.score !== undefined) {
    return sightengine.score < 30 && physical.score >= 55;
  }
  return reviewCase.primaryImage?.metadata_status === "stripped" && (behaviouralPressure(reviewCase) >= 2 || index % 4 === 2);
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

function openSideBySideVerifierWindows() {
  const availableWidth = window.screen.availWidth || 1440;
  const availableHeight = window.screen.availHeight || 900;
  const width = Math.max(520, Math.floor(availableWidth / 2));
  const height = Math.max(700, availableHeight);
  const top = 0;
  const leftWindow = window.open(
    "https://chatgpt.com/",
    "manual-ai-check-chatgpt",
    `popup=yes,width=${width},height=${height},left=0,top=${top}`
  );
  const rightWindow = window.open(
    "https://gemini.google.com/app",
    "manual-ai-check-gemini",
    `popup=yes,width=${width},height=${height},left=${width},top=${top}`
  );
  leftWindow?.focus();
  rightWindow?.focus();
}

createRoot(document.getElementById("root")!).render(<App />);
