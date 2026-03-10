declare module 'https://esm.sh/@supabase/supabase-js@2.38.4' {
  export * from '@supabase/supabase-js';
}

declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => unknown;
  env: {
    get: (key: string) => string | undefined;
  };
};
