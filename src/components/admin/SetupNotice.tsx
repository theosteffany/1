export function SetupNotice() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <p className="eyebrow text-olive">Admin</p>
      <h1 className="display mt-4 text-5xl">Connect Supabase</h1>
      <p className="mt-6 leading-relaxed text-ink/75">
        The dashboard needs a Supabase project for the database, login and media storage. Until then the public site
        shows placeholder content.
      </p>
      <ol className="mt-8 list-decimal space-y-3 pl-5 leading-relaxed text-ink/80">
        <li>Create a free project at supabase.com.</li>
        <li>
          In <strong>SQL Editor</strong>, run <code className="rounded bg-sand px-1.5 py-0.5">supabase/schema.sql</code> from this repo.
        </li>
        <li>
          Copy <code className="rounded bg-sand px-1.5 py-0.5">.env.example</code> to{" "}
          <code className="rounded bg-sand px-1.5 py-0.5">.env.local</code> and fill in the project URL and anon key
          (Project Settings → API).
        </li>
        <li>
          In <strong>Authentication → Users</strong>, add your user, then make it an admin:
          <pre className="mt-2 overflow-x-auto rounded bg-ink p-4 text-xs text-bone">
            {`insert into public.admins (user_id)\nselect id from auth.users where email = 'you@example.com';`}
          </pre>
        </li>
        <li>Restart the dev server (or redeploy) and sign in at /admin.</li>
      </ol>
      <p className="mt-8 text-sm text-ink/60">Full instructions are in the README.</p>
    </main>
  );
}
