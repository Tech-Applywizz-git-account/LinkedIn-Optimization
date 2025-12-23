// lib/variationgate.ts
import { decideAcceptance, isSufficientlyDifferent } from "@/lib/variations";

type GateCfg = {
  maxAttempts?: number;
  thresholds?: {
    maxJaccard?: number;
    maxOverlap?: number;
    minDeltaChars?: number;
  };
};

export class VariationGate {
  private maxAttempts: number;
  private thresholds?: GateCfg["thresholds"];

  constructor(cfg?: GateCfg) {
    this.maxAttempts = Math.max(1, cfg?.maxAttempts ?? 3);
    this.thresholds = cfg?.thresholds;
  }

  private makeNonce(i: number): string {
    return (
      Date.now().toString(36) +
      "-" +
      i.toString(36) +
      "-" +
      Math.random().toString(36).slice(2, 10)
    );
  }

  /**
   * Calls `producer(nonce)` up to `maxAttempts` times.
   * If any attempt is sufficiently different, returns it immediately.
   * Otherwise returns the most-different attempt (never throws for similarity).
   */
  async tryDifferent(
    producer: (nonce: string) => Promise<string>,
    previous: string[]
  ): Promise<{ content: string; accepted: boolean; attempts: number }> {
    const attempts: string[] = [];

    for (let i = 0; i < this.maxAttempts; i++) {
      const nonce = this.makeNonce(i);
      const out = (await producer(nonce)) || "";
      attempts.push(out);

      if (out.trim()) {
        const chk = isSufficientlyDifferent(out, previous, this.thresholds);
        if (chk.ok) {
          return { content: out, accepted: true, attempts: attempts.length };
        }
      }
    }

    const pick = decideAcceptance(attempts, previous, this.thresholds);
    return { content: pick.value, accepted: pick.accepted, attempts: pick.attempts };
  }
}
