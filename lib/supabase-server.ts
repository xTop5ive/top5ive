// lib/supabase-server.ts
// TEMP demo stub: lets the app compile even if Supabase isn't set up.
// Replace with real @supabase/ssr client when you reconnect backend.

export async function createClient() {
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
      },
    } as any;
  }