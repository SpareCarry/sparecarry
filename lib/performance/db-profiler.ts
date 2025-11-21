/**
 * Database Performance Profiler
 * 
 * Wraps Supabase queries with performance telemetry
 * Records query name, time taken, and warns on slow queries
 */

type PostgrestQueryBuilder = {
  select: (...args: any[]) => PostgrestFilterBuilder;
  insert: (...args: any[]) => PostgrestFilterBuilder;
  update: (...args: any[]) => PostgrestFilterBuilder;
  delete: (...args: any[]) => PostgrestFilterBuilder;
};

type PostgrestFilterBuilder = {
  then?: (...args: any[]) => Promise<any>;
  single?: (...args: any[]) => Promise<any>;
};

interface QueryMetric {
  table: string;
  operation: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

class DatabaseProfiler {
  private metrics: QueryMetric[] = [];
  private slowThreshold = 100; // ms
  private enabled = true;
  private logger: {
    debug: (message: string, data?: unknown) => void;
    warn: (message: string, data?: unknown) => void;
  };

  constructor() {
    this.enabled = process.env.NODE_ENV !== 'production' || 
                   process.env.NEXT_PUBLIC_ENABLE_PERF === 'true';

    // Use debug logger, never console.log
    this.logger = {
      debug: (message: string, data?: unknown) => {
        if (this.enabled && process.env.NEXT_PUBLIC_DEBUG_PERF === 'true') {
          console.debug(`[DB Perf] ${message}`, data);
        }
      },
      warn: (message: string, data?: unknown) => {
        if (this.enabled) {
          console.warn(`[DB Perf] ${message}`, data);
        }
      },
    };
  }

  /**
   * Wrap a Supabase query with performance tracking
   */
  async wrapQuery<T>(
    table: string,
    operation: string,
    queryFn: () => Promise<{ data: T | null; error: unknown }>
  ): Promise<{ data: T | null; error: unknown }> {
    if (!this.enabled) {
      return queryFn();
    }

    const startTime = performance.now();
    const timestamp = Date.now();

    try {
      const result = await queryFn();
      const duration = performance.now() - startTime;

      // Record metric
      this.recordMetric({
        table,
        operation,
        duration,
        timestamp,
        metadata: {
          hasError: !!result.error,
          hasData: !!result.data,
        },
      });

      // Log to debug logger
      this.logger.debug(`Query: ${table}.${operation}`, {
        duration: `${duration.toFixed(2)}ms`,
        hasData: !!result.data,
        hasError: !!result.error,
      });

      // Warn on slow queries
      if (duration > this.slowThreshold) {
        this.logger.warn(`Slow query detected: ${table}.${operation} took ${duration.toFixed(2)}ms`, {
          table,
          operation,
          duration,
          threshold: this.slowThreshold,
        });
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      this.recordMetric({
        table,
        operation,
        duration,
        timestamp,
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      this.logger.warn(`Query error: ${table}.${operation}`, {
        duration: `${duration.toFixed(2)}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Record metric
   */
  private recordMetric(metric: QueryMetric): void {
    this.metrics.push(metric);

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): QueryMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by table
   */
  getMetricsByTable(table: string): QueryMetric[] {
    return this.metrics.filter((m) => m.table === table);
  }

  /**
   * Get slow queries
   */
  getSlowQueries(threshold?: number): QueryMetric[] {
    const limit = threshold || this.slowThreshold;
    return this.metrics.filter((m) => m.duration > limit);
  }

  /**
   * Get average query time for a table
   */
  getAverageQueryTime(table: string): number | null {
    const metrics = this.getMetricsByTable(table);
    if (metrics.length === 0) return null;

    const sum = metrics.reduce((acc, m) => acc + m.duration, 0);
    return sum / metrics.length;
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    totalQueries: number;
    slowQueries: number;
    averageQueryTime: number;
    slowestQueries: QueryMetric[];
  } {
    const slowQueries = this.getSlowQueries();
    const avgTime = this.metrics.length > 0
      ? this.metrics.reduce((acc, m) => acc + m.duration, 0) / this.metrics.length
      : 0;

    const slowest = [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return {
      totalQueries: this.metrics.length,
      slowQueries: slowQueries.length,
      averageQueryTime: avgTime,
      slowestQueries: slowest,
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }
}

// Singleton instance
export const dbProfiler = new DatabaseProfiler();

/**
 * Create a profiled Supabase query builder
 */
export function createProfiledQuery(
  table: string,
  queryBuilder: PostgrestQueryBuilder
): PostgrestQueryBuilder {
  // Wrap the query builder methods
  const originalSelect = queryBuilder.select.bind(queryBuilder);
  const originalInsert = queryBuilder.insert.bind(queryBuilder);
  const originalUpdate = queryBuilder.update.bind(queryBuilder);
  const originalDelete = queryBuilder.delete.bind(queryBuilder);

  // Wrap select
  queryBuilder.select = function(columns?: string) {
    const result = originalSelect(columns);
    return wrapFilterBuilder(result, table, 'select');
  };

  // Wrap insert
  queryBuilder.insert = function(values: any) {
    const result = originalInsert(values);
    return wrapFilterBuilder(result, table, 'insert');
  };

  // Wrap update
  queryBuilder.update = function(values: any) {
    const result = originalUpdate(values);
    return wrapFilterBuilder(result, table, 'update');
  };

  // Wrap delete
  queryBuilder.delete = function() {
    const result = originalDelete();
    return wrapFilterBuilder(result, table, 'delete');
  };

  return queryBuilder;
}

/**
 * Wrap filter builder with performance tracking
 */
function wrapFilterBuilder(
  builder: PostgrestFilterBuilder,
  table: string,
  operation: string
): PostgrestFilterBuilder {
  const originalThen = builder.then?.bind(builder);
  const originalSingle = builder.single?.bind(builder);

  if (originalThen) {
    builder.then = async function(callback: any) {
      return dbProfiler.wrapQuery(table, operation, async () => {
        const result = await originalThen(callback);
        return { data: result, error: null };
      }).then((r) => r.data);
    };
  }

  if (originalSingle) {
    builder.single = async function() {
      return dbProfiler.wrapQuery(table, `${operation}.single`, async () => {
        const result = await originalSingle();
        return result;
      });
    };
  }

  return builder;
}

/**
 * Helper to profile a Supabase query
 */
export async function profileQuery<T>(
  table: string,
  operation: string,
  queryFn: () => Promise<{ data: T | null; error: unknown }>
): Promise<{ data: T | null; error: unknown }> {
  return dbProfiler.wrapQuery(table, operation, queryFn);
}

