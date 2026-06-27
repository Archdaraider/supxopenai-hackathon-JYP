import { claims, getEnrichedClaim } from "../data/load";
import { aggregateSignals } from "../scoring/aggregate";
import { behaviouralContext } from "../signals/behaviouralContext";
import { ImageReuse } from "../signals/imageReuse";
import type { Band, ScoredClaim, SignalResult } from "../types";

const imageReuse = new ImageReuse(claims);
let failures = 0;

function isBand(value: string | undefined): value is Band {
  return value === "Low" || value === "Elevated" || value === "High";
}

function assertCondition(condition: boolean, message: string): void {
  if (!condition) {
    failures += 1;
    console.error(`FAIL ${message}`);
  }
}

function topSignal(signals: SignalResult[]): string {
  return [...signals].sort((a, b) => b.risk * b.confidence - a.risk * a.confidence)[0]?.name ?? "none";
}

async function scoreDeterministic(claimId: string): Promise<ScoredClaim> {
  const enrichedClaim = getEnrichedClaim(claimId);
  const settled = await Promise.allSettled([
    imageReuse.evaluate(enrichedClaim),
    behaviouralContext.evaluate(enrichedClaim),
  ]);
  const signals = settled.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
  const aggregate = aggregateSignals(signals);

  return {
    claimId,
    riskScore: aggregate.riskScore,
    band: aggregate.band,
    hardFlag: aggregate.hardFlag,
    signals,
    breakdown: aggregate.breakdown,
    explanation: "Deterministic eval only: OpenAI vision and narrator were not called.",
    recommendedAction:
      aggregate.band === "Low" ? "Release" : aggregate.band === "Elevated" ? "Request evidence" : "Escalate",
  };
}

async function main() {
  let passed = 0;
  let lowLegitimateKeptLow = 0;
  let logisticsKeptLow = 0;
  let highHardFlags = 0;
  let expectedHigh = 0;
  let actualHigh = 0;

  console.log("Deterministic eval: Signal 2 + Signal 3 + aggregation only. OpenAI is not called.");
  console.log("claimId | expected | actual | riskScore | hardFlag | topSignal | PASS/FAIL");

  for (const claim of claims) {
    const scored = await scoreDeterministic(claim.id);
    const expected = claim._dev?.expected_band;
    const pass = isBand(expected) ? scored.band === expected : true;

    if (pass) passed += 1;
    if (expected === "High") expectedHigh += 1;
    if (scored.band === "High") actualHigh += 1;
    if (scored.band === "High" && scored.hardFlag) highHardFlags += 1;
    if (claim._dev?.ground_truth === "legitimate" && scored.band === "Low") lowLegitimateKeptLow += 1;
    if (["C010", "C011", "C012"].includes(claim.id) && scored.band === "Low") logisticsKeptLow += 1;

    assertCondition(pass, `${claim.id} expected ${expected}, got ${scored.band}`);
    if (scored.band === "High") {
      assertCondition(Boolean(scored.hardFlag), `${claim.id} is High without a hard signal`);
    }

    console.log(
      `${claim.id} | ${expected ?? "unknown"} | ${scored.band} | ${scored.riskScore}` +
        ` | ${scored.hardFlag ?? "none"} | ${topSignal(scored.signals)} | ${pass ? "PASS" : "FAIL"}`,
    );
  }

  console.log("\nProof summary");
  console.log(`pass=${passed}/${claims.length}`);
  console.log(`highBandPrecisionSeeded=${actualHigh === 0 ? "n/a" : `${highHardFlags}/${actualHigh}`}`);
  console.log(`expectedHighClaims=${expectedHigh}`);
  console.log(`highClaimsCausedByHardFlags=${highHardFlags}`);
  console.log(`lowLegitimateClaimsStayedLow=${lowLegitimateKeptLow}`);
  console.log(`logisticsClusterStayedLow=${logisticsKeptLow}/3`);
  console.log("note=vision disabled; this proves the deterministic spine without OpenAI cost.");

  if (failures > 0) {
    console.error(`\n${failures} deterministic assertion(s) failed.`);
    process.exit(1);
  }

  console.log("\nAll deterministic assertions passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
