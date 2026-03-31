type PerformanceMetric = {
  label: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
};

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private readonly MAX_METRICS = 1000;

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(): () => number {
    const start = performance.now();
    return () => performance.now() - start;
  }

  logMetric(label: string, duration: number, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      label,
      duration: Math.round(duration * 100) / 100,
      timestamp: Date.now(),
      metadata,
    };

    console.log(`[PERF] ${label}: ${metric.duration}ms`, metadata || "");

    this.metrics.push(metric);
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }
  }

  getMetrics(label?: string): PerformanceMetric[] {
    if (label) {
      return this.metrics.filter((m) => m.label === label);
    }
    return this.metrics;
  }

  getAverageDuration(label: string): number {
    const relevantMetrics = this.getMetrics(label);
    if (relevantMetrics.length === 0) return 0;
    const sum = relevantMetrics.reduce((acc, m) => acc + m.duration, 0);
    return Math.round((sum / relevantMetrics.length) * 100) / 100;
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

export async function withPerformanceLogging<T>(
  label: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const stopTimer = performanceMonitor.startTimer();
  try {
    const result = await fn();
    const duration = stopTimer();
    performanceMonitor.logMetric(label, duration, metadata);
    return result;
  } catch (error) {
    const duration = stopTimer();
    performanceMonitor.logMetric(`${label}_ERROR`, duration, { ...metadata, error: (error as Error).message });
    throw error;
  }
}
