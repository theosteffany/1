export function Footer({ name, tagline }: { name: string; tagline: string }) {
  return (
    <footer className="bg-ink py-10 text-bone/60">
      <div className="container-x flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <p className="display text-2xl text-bone">{name}</p>
        <p className="eyebrow text-[0.62rem]">{tagline}</p>
        <p className="text-xs">
          © {new Date().getFullYear()} {name}. All rights reserved.
          <a href="#top" className="eyebrow ml-6 text-[0.62rem] text-bone hover:text-sand">
            Back to top ↑
          </a>
        </p>
      </div>
    </footer>
  );
}
