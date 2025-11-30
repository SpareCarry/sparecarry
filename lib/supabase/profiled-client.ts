/**
 * Profiled Supabase Client
 *
 * Wraps Supabase client with performance profiling
 * Automatically tracks all database queries
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { profileQuery } from "../performance/db-profiler";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Create a profiled Supabase client
 * All queries are automatically tracked for performance
 */
export function createProfiledClient(
  supabaseUrl: string,
  supabaseKey: string
): SupabaseClient {
  const client = createSupabaseClient(supabaseUrl, supabaseKey);

  // Wrap the from() method to profile all queries
  const originalFrom = client.from.bind(client);

  client.from = function (table: string) {
    const queryBuilder = originalFrom(table);

    // Wrap common query methods
    const originalSelect = queryBuilder.select.bind(queryBuilder);
    const originalInsert = queryBuilder.insert.bind(queryBuilder);
    const originalUpdate = queryBuilder.update.bind(queryBuilder);
    const originalDelete = queryBuilder.delete.bind(queryBuilder);
    const originalUpsert = queryBuilder.upsert?.bind(queryBuilder);

    // Wrap select
    queryBuilder.select = function (columns?: string) {
      const result = originalSelect(columns);
      return wrapQueryBuilder(result, table, "select");
    };

    // Wrap insert
    queryBuilder.insert = function (values: any) {
      const result = originalInsert(values);
      return wrapQueryBuilder(result, table, "insert");
    };

    // Wrap update
    queryBuilder.update = function (values: any) {
      const result = originalUpdate(values);
      return wrapQueryBuilder(result, table, "update");
    };

    // Wrap delete
    queryBuilder.delete = function () {
      const result = originalDelete();
      return wrapQueryBuilder(result, table, "delete");
    };

    // Wrap upsert if available
    if (originalUpsert) {
      queryBuilder.upsert = function (values: any) {
        const result = originalUpsert(values);
        return wrapQueryBuilder(result, table, "upsert");
      };
    }

    return queryBuilder;
  };

  return client;
}

/**
 * Wrap query builder with performance tracking
 */
function wrapQueryBuilder<T>(
  builder: any,
  table: string,
  operation: string
): any {
  // Wrap then() method
  const originalThen = builder.then?.bind(builder);
  if (originalThen) {
    builder.then = async function (callback: any) {
      return profileQuery(table, operation, async () => {
        try {
          const result = await originalThen(callback);
          return { data: result, error: null };
        } catch (error) {
          return { data: null, error };
        }
      }).then((r) => r.data);
    };
  }

  // Wrap single() method
  const originalSingle = builder.single?.bind(builder);
  if (originalSingle) {
    builder.single = async function () {
      return profileQuery(table, `${operation}.single`, async () => {
        try {
          const result = await originalSingle();
          return result;
        } catch (error) {
          return { data: null, error };
        }
      });
    };
  }

  // Wrap maybeSingle() method
  const originalMaybeSingle = builder.maybeSingle?.bind(builder);
  if (originalMaybeSingle) {
    builder.maybeSingle = async function () {
      return profileQuery(table, `${operation}.maybeSingle`, async () => {
        try {
          const result = await originalMaybeSingle();
          return result;
        } catch (error) {
          return { data: null, error };
        }
      });
    };
  }

  return builder;
}
