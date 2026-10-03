import { Database } from 'lucide-react'

import { Logo } from './Logo'

/** Shown when the app is started without Supabase credentials. */
export function SetupScreen() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-8 px-6 py-16">
      <Logo />
      <div>
        <p className="eyebrow mb-3">Setup required</p>
        <h1 className="font-display text-4xl font-bold uppercase leading-none">Connect Supabase</h1>
        <p className="mt-4 text-muted-foreground">
          Comeback HQ stores everything in Supabase, protected by Row Level Security. Add your project credentials to
          start.
        </p>
      </div>
      <ol className="space-y-4 text-sm">
        {[
          <>Create a project at <span className="font-medium text-foreground">supabase.com</span>.</>,
          <>Apply the migrations in <code className="rounded bg-secondary px-1.5 py-0.5">supabase/migrations</code> (<code className="rounded bg-secondary px-1.5 py-0.5">supabase db push</code>, or paste them in order into the SQL editor).</>,
          <>Copy <code className="rounded bg-secondary px-1.5 py-0.5">.env.example</code> to <code className="rounded bg-secondary px-1.5 py-0.5">.env.local</code> and set <code className="rounded bg-secondary px-1.5 py-0.5">VITE_SUPABASE_URL</code> and <code className="rounded bg-secondary px-1.5 py-0.5">VITE_SUPABASE_ANON_KEY</code>.</>,
          <>Restart <code className="rounded bg-secondary px-1.5 py-0.5">npm run dev</code>.</>,
        ].map((step, i) => (
          <li key={i} className="flex gap-4 rounded-2xl border bg-card p-4">
            <span className="font-display text-2xl font-bold leading-none text-volt">{i + 1}</span>
            <span className="text-muted-foreground">{step}</span>
          </li>
        ))}
      </ol>
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Database className="size-3.5" /> The anon key is safe in the browser — RLS enforces every permission.
      </p>
    </main>
  )
}
