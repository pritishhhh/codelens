interface AppHeaderProps {
  children?: React.ReactNode;
}

export default function AppHeader({ children }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            CL
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-50">CodeLens</h1>
            <p className="text-xs text-zinc-500">AI-powered code review assistant</p>
          </div>
        </div>
        {children}
      </div>
    </header>
  );
}
