export interface NetworkActivityRecord {
  destinations: string[];
  suspicious: string[];
}

const ALLOWLIST = ["api.anthropic.com"];

export async function recordNetworkActivity<T>(
  callback: () => Promise<T>
): Promise<{ result: T; activity: NetworkActivityRecord }> {
  // TODO(v2): wire real network capture via tcpdump or similar
  const result = await callback();
  return {
    result,
    activity: { destinations: [], suspicious: [] },
  };
}

export function assertOnlyAnthropicAPI(
  activity: NetworkActivityRecord
): { ok: boolean; violations: string[] } {
  // TODO(v2): enforce allowlist once recordNetworkActivity captures real traffic
  const violations = activity.destinations.filter((d) => !ALLOWLIST.includes(d));
  if (violations.length > 0) {
    return { ok: false, violations };
  }
  return { ok: true, violations: [] };
}
