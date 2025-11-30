declare module "https://esm.sh/@supabase/supabase-js@2" {
  export interface SupabaseClientOptions<SchemaName = any> {
    schema?: SchemaName;
    global?: {
      headers?: Record<string, string>;
    };
    auth?: {
      persistSession?: boolean;
      autoRefreshToken?: boolean;
      detectSessionInUrl?: boolean;
    };
  }

  export interface SupabaseClient<SchemaName = any> {
    from<TableName extends string>(
      table: TableName
    ): {
      select(columns?: string): {
        eq(column: string, value: any): any;
        not(column: string, operator: string, value: any): any;
      };
    };
  }

  export function createClient<SchemaName = any>(
    supabaseUrl: string,
    supabaseKey: string,
    options?: SupabaseClientOptions<SchemaName>
  ): SupabaseClient<SchemaName>;
}
