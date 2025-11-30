/**
 * Mock Supabase Storage Implementation
 */

import type { MockStorage, MockStorageBucket } from "./types";

const mockStorageFiles: Record<
  string,
  Record<string, { file: Blob; metadata?: Record<string, unknown> }>
> = {};

export function createMockStorage(): MockStorage {
  return {
    from: (bucket: string) => createMockStorageBucket(bucket),
  };
}

function createMockStorageBucket(bucket: string): MockStorageBucket {
  if (!mockStorageFiles[bucket]) {
    mockStorageFiles[bucket] = {};
  }

  return {
    upload: async (
      path: string,
      file: File | Blob,
      options?: { upsert?: boolean }
    ) => {
      if (!options?.upsert && mockStorageFiles[bucket][path]) {
        return {
          data: null,
          error: {
            message: "File already exists",
            statusCode: "409",
          } as unknown as null,
        };
      }

      mockStorageFiles[bucket][path] = {
        file,
        metadata: {
          size: file.size,
          type: file.type,
          uploaded_at: new Date().toISOString(),
        },
      };

      return { data: { path }, error: null };
    },

    download: async (path: string) => {
      const fileData = mockStorageFiles[bucket]?.[path];
      if (!fileData) {
        return {
          data: null,
          error: {
            message: "File not found",
            statusCode: "404",
          } as unknown as null,
        };
      }

      return { data: fileData.file, error: null };
    },

    list: async (
      path?: string,
      options?: { limit?: number; offset?: number }
    ) => {
      const files = Object.keys(mockStorageFiles[bucket] || {})
        .filter((filePath) => !path || filePath.startsWith(path))
        .map((filePath) => ({
          name: filePath.split("/").pop() || filePath,
          id: filePath,
          updated_at:
            (mockStorageFiles[bucket][filePath]?.metadata
              ?.uploaded_at as string) || new Date().toISOString(),
          created_at:
            (mockStorageFiles[bucket][filePath]?.metadata
              ?.uploaded_at as string) || new Date().toISOString(),
          last_accessed_at: new Date().toISOString(),
          metadata: mockStorageFiles[bucket][filePath]?.metadata || {},
        }));

      const offset = options?.offset || 0;
      const limit = options?.limit || files.length;
      const paginated = files.slice(offset, offset + limit);

      return { data: paginated, error: null };
    },

    remove: async (paths: string[]) => {
      const removed: { path: string }[] = [];
      paths.forEach((path) => {
        if (mockStorageFiles[bucket]?.[path]) {
          delete mockStorageFiles[bucket][path];
          removed.push({ path });
        }
      });

      return { data: removed, error: null };
    },

    getPublicUrl: (path: string) => {
      const baseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL || "https://test.supabase.co";
      return {
        data: {
          publicUrl: `${baseUrl}/storage/v1/object/public/${bucket}/${path}`,
        },
      };
    },

    createSignedUrl: async (path: string, expiresIn: number) => {
      const baseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL || "https://test.supabase.co";
      const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
      return {
        data: {
          signedUrl: `${baseUrl}/storage/v1/object/sign/${bucket}/${path}?expires=${expiresAt}`,
        },
        error: null,
      };
    },
  };
}

/**
 * Reset storage mock
 */
export function resetMockStorage(): void {
  Object.keys(mockStorageFiles).forEach((bucket) => {
    delete mockStorageFiles[bucket];
  });
}

/**
 * Get mock storage files
 */
export function getMockStorageFiles(
  bucket: string
): Record<string, { file: Blob; metadata?: Record<string, unknown> }> {
  return mockStorageFiles[bucket] || {};
}
