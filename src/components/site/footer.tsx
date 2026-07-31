const columns = [
  {
    title: "Product",
    links: ["Journaling", "Mood analysis", "Reflections", "Dashboard"],
  },
  {
    title: "Company",
    links: ["About", "Careers", "Press", "Contact"],
  },
  {
    title: "Trust",
    links: ["Privacy", "Security", "Terms", "Clinical advisors"],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background px-6 py-16 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="grid size-8 place-items-center rounded-full border border-border bg-primary-soft"
              >
                <span className="block size-2.5 rounded-full bg-primary" />
              </span>
              <span className="font-display text-lg tracking-tight">MindCare AI</span>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              A quiet, private place to write things down and slowly understand
              yourself better.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {column.title}
              </h3>
              <ul className="mt-5 space-y-3 text-sm">
                {column.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#cta"
                      className="text-foreground/75 transition-colors duration-300 hover:text-primary"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-border pt-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} MindCare AI. Written in confidence.</p>
          <p>
            MindCare AI supports wellbeing and is not a substitute for
            professional care.
          </p>
        </div>
      </div>
    </footer>
  );
}
