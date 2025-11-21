/**
 * Mock Supabase Query Builder
 * 
 * Implements the Supabase query builder interface with in-memory filtering
 */

import type { MockQueryBuilder } from './types';
import { getMockData, addMockData, updateMockData, deleteMockData } from './mockDataStore';

export function createMockQueryBuilder(table: string): MockQueryBuilder {
  let query: {
    type: 'select' | 'insert' | 'update' | 'upsert' | 'delete';
    filters: Array<{
      type: string;
      column?: string;
      value?: unknown;
      values?: unknown[];
      pattern?: string;
      filter?: string;
    }>;
    data?: unknown | unknown[];
    columns?: string;
    orderBy?: { column: string; ascending: boolean };
    limitCount?: number;
    rangeFrom?: number;
    rangeTo?: number;
  } = {
    type: 'select',
    filters: [],
  };

  const applyFilters = <T>(data: T[]): T[] => {
    let result = [...data];

    for (const filter of query.filters) {
      switch (filter.type) {
        case 'eq':
          if (filter.column) {
            result = result.filter((item: unknown) => {
              const record = item as Record<string, unknown>;
              return record[filter.column!] === filter.value;
            });
          }
          break;
        case 'neq':
          if (filter.column) {
            result = result.filter((item: unknown) => {
              const record = item as Record<string, unknown>;
              return record[filter.column!] !== filter.value;
            });
          }
          break;
        case 'gt':
          if (filter.column) {
            result = result.filter((item: unknown) => {
              const record = item as Record<string, unknown>;
              return (record[filter.column!] as number) > (filter.value as number);
            });
          }
          break;
        case 'gte':
          if (filter.column) {
            result = result.filter((item: unknown) => {
              const record = item as Record<string, unknown>;
              return (record[filter.column!] as number) >= (filter.value as number);
            });
          }
          break;
        case 'lt':
          if (filter.column) {
            result = result.filter((item: unknown) => {
              const record = item as Record<string, unknown>;
              return (record[filter.column!] as number) < (filter.value as number);
            });
          }
          break;
        case 'lte':
          if (filter.column) {
            result = result.filter((item: unknown) => {
              const record = item as Record<string, unknown>;
              return (record[filter.column!] as number) <= (filter.value as number);
            });
          }
          break;
        case 'like':
          if (filter.column && filter.pattern) {
            const regex = new RegExp(filter.pattern.replace('%', '.*'));
            result = result.filter((item: unknown) => {
              const record = item as Record<string, unknown>;
              return regex.test(String(record[filter.column!]));
            });
          }
          break;
        case 'ilike':
          if (filter.column && filter.pattern) {
            const regex = new RegExp(filter.pattern.replace('%', '.*'), 'i');
            result = result.filter((item: unknown) => {
              const record = item as Record<string, unknown>;
              return regex.test(String(record[filter.column!]));
            });
          }
          break;
        case 'is':
          if (filter.column) {
            result = result.filter((item: unknown) => {
              const record = item as Record<string, unknown>;
              return record[filter.column!] === filter.value || record[filter.column!] === null;
            });
          }
          break;
        case 'in':
          if (filter.column && filter.values) {
            result = result.filter((item: unknown) => {
              const record = item as Record<string, unknown>;
              return filter.values!.includes(record[filter.column!]);
            });
          }
          break;
        case 'contains':
          if (filter.column) {
            result = result.filter((item: unknown) => {
              const record = item as Record<string, unknown>;
              const value = record[filter.column!];
              if (Array.isArray(value)) {
                return value.includes(filter.value);
              }
              return false;
            });
          }
          break;
      }
    }

    return result;
  };

  const applyOrdering = <T>(data: T[]): T[] => {
    if (!query.orderBy) {
      return data;
    }

    const sorted = [...data];
    sorted.sort((a: unknown, b: unknown) => {
      const aRecord = a as Record<string, unknown>;
      const bRecord = b as Record<string, unknown>;
      const aVal = aRecord[query.orderBy!.column];
      const bVal = bRecord[query.orderBy!.column];

      const normalize = (value: unknown): number | string => {
        if (typeof value === 'number' || typeof value === 'string') {
          return value;
        }
        if (value instanceof Date) {
          return value.getTime();
        }
        return String(value ?? '');
      };

      const normalizedA = normalize(aVal);
      const normalizedB = normalize(bVal);

      if (normalizedA === normalizedB) return 0;
      const comparison = normalizedA > normalizedB ? 1 : -1;
      return query.orderBy!.ascending ? comparison : -comparison;
    });

    return sorted;
  };

  const applyLimit = <T>(data: T[]): T[] => {
    if (query.rangeFrom !== undefined && query.rangeTo !== undefined) {
      return data.slice(query.rangeFrom, query.rangeTo + 1);
    }
    if (query.limitCount !== undefined) {
      return data.slice(0, query.limitCount);
    }
    return data;
  };

  const builder: MockQueryBuilder = {
    select: (columns) => {
      query.type = 'select';
      query.columns = columns;
      return builder;
    },
    insert: (data) => {
      query.type = 'insert';
      query.data = data;
      return builder;
    },
    update: (data) => {
      query.type = 'update';
      query.data = data;
      return builder;
    },
    upsert: (data) => {
      query.type = 'upsert';
      query.data = data;
      return builder;
    },
    delete: () => {
      query.type = 'delete';
      return builder;
    },
    eq: (column, value) => {
      query.filters.push({ type: 'eq', column, value });
      return builder;
    },
    neq: (column, value) => {
      query.filters.push({ type: 'neq', column, value });
      return builder;
    },
    gt: (column, value) => {
      query.filters.push({ type: 'gt', column, value });
      return builder;
    },
    gte: (column, value) => {
      query.filters.push({ type: 'gte', column, value });
      return builder;
    },
    lt: (column, value) => {
      query.filters.push({ type: 'lt', column, value });
      return builder;
    },
    lte: (column, value) => {
      query.filters.push({ type: 'lte', column, value });
      return builder;
    },
    like: (column, pattern) => {
      query.filters.push({ type: 'like', column, pattern });
      return builder;
    },
    ilike: (column, pattern) => {
      query.filters.push({ type: 'ilike', column, pattern });
      return builder;
    },
    is: (column, value) => {
      query.filters.push({ type: 'is', column, value });
      return builder;
    },
    in: (column, values) => {
      query.filters.push({ type: 'in', column, values });
      return builder;
    },
    contains: (column, value) => {
      query.filters.push({ type: 'contains', column, value });
      return builder;
    },
    or: (filter) => {
      query.filters.push({ type: 'or', filter });
      return builder;
    },
    order: (column, options) => {
      query.orderBy = { column, ascending: options?.ascending ?? true };
      return builder;
    },
    limit: (count) => {
      query.limitCount = count;
      return builder;
    },
    range: (from, to) => {
      query.rangeFrom = from;
      query.rangeTo = to;
      return builder;
    },
    single: async () => {
      const allData = getMockData(table);
      const filtered = applyFilters(allData);
      const result = filtered[0] || null;
      return { data: result, error: null };
    },
    maybeSingle: async () => {
      const allData = getMockData(table);
      const filtered = applyFilters(allData);
      const result = filtered.length === 1 ? filtered[0] : null;
      return { data: result, error: null };
    },
    then: async <T>(callback: (result: { data: T[] | null; error: null }) => T) => {
      if (query.type === 'insert' && query.data) {
        const dataArray = Array.isArray(query.data) ? query.data : [query.data];
        const inserted = dataArray.map((item) => {
          const record = item as Record<string, unknown>;
          if (!record.id) {
            record.id = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          }
          if (!record.created_at) {
            record.created_at = new Date().toISOString();
          }
          if (!record.updated_at) {
            record.updated_at = new Date().toISOString();
          }
          return addMockData(table, record);
        });
        return callback({ data: inserted as T[], error: null });
      }

      if (query.type === 'update' && query.data) {
        const updates = query.data as Record<string, unknown>;
        const allData = getMockData(table);
        const filtered = applyFilters(allData);
        
        const updated = filtered.map((item) => {
          const record = item as Record<string, unknown>;
          const updatedRecord = { ...record, ...updates, updated_at: new Date().toISOString() };
          updateMockData(table, record.id as string, updatedRecord);
          return updatedRecord;
        });

        return callback({ data: updated as T[], error: null });
      }

      if (query.type === 'upsert' && query.data) {
        const dataArray = Array.isArray(query.data) ? query.data : [query.data];
        const upserted = dataArray.map((item) => {
          const record = item as Record<string, unknown>;
          if (record.id) {
            const existing = getMockData(table).find((r: unknown) => {
              const rRecord = r as Record<string, unknown>;
              return rRecord.id === record.id;
            });
            if (existing) {
              return updateMockData(table, record.id as string, { ...record, updated_at: new Date().toISOString() });
            }
          }
          if (!record.id) {
            record.id = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          }
          if (!record.created_at) {
            record.created_at = new Date().toISOString();
          }
          return addMockData(table, record);
        });
        return callback({ data: upserted.filter(Boolean) as T[], error: null });
      }

      if (query.type === 'delete') {
        const allData = getMockData(table);
        const filtered = applyFilters(allData);
        filtered.forEach((item) => {
          const record = item as Record<string, unknown>;
          deleteMockData(table, record.id as string);
        });
        return callback({ data: filtered as T[], error: null });
      }

      if (query.type === 'select') {
        const allData = getMockData(table);
        let result = applyFilters(allData);
        result = applyOrdering(result);
        result = applyLimit(result);
        return callback({ data: result as T[], error: null });
      }

      return callback({ data: [] as T[], error: null });
    },
  };

  return builder;
}

