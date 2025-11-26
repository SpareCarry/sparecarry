declare module "https://deno.land/std@0.168.0/http/server.ts" {
  interface ServeInit {
    port?: number;
    hostname?: string;
    handler: (request: Request) => Response | Promise<Response>;
    onListen?: (params: { port: number; hostname: string }) => void;
  }

  // Simplified `serve` signatures sufficient for type-checking in this project.
  export function serve(
    handler: (request: Request) => Response | Promise<Response>
  ): void;

  export function serve(options: ServeInit): void;
}


