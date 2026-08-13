export function getPerformanceColor(percent: number): { bg: string; label: string } {
  if (percent >= 75) return { bg: "#1AC082", label: "ممتاز" }; // Dark Green
  if (percent >= 50) return { bg: "#4CAF50", label: "جيد" }; // Green
  if (percent >= 25) return { bg: "#FF9800", label: "متوسط" }; // Orange
  return { bg: "#F44336", label: "ضعيف" }; // Red
}

export function getKpiPercent(kpi: { targetValue: number | null; achievedValue: number | null }): number {
  if (kpi.targetValue === null || kpi.achievedValue === null || !kpi.targetValue) return 0;
  return Math.min(100, Math.round((kpi.achievedValue / kpi.targetValue) * 100));
}
