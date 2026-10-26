interface AppHeaderProps {
  children?: React.ReactNode;
}

export default function AppHeader({ children }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-600 text-lg font-bold text-white shadow-lg shadow-indigo-950/40" aria-hidden="true">
            {"</>"}
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-50">CodeLens</h1>
            <p className="text-xs text-zinc-400">Edit. Understand. Improve.</p>
          </div>
        </div>
        {children}
        <a href="https://github.com/pritishhhh/codelens" target="_blank" rel="noreferrer" className="tool-button">GitHub ↗</a>
      </div>
    </header>
  );
}
