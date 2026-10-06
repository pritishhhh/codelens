export default function AppFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-800 py-6">
      <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-zinc-500">
        <p>Built with React, TypeScript & Next.js</p>
        <span aria-hidden="true">·</span>
        <a href="https://github.com/pritishhhh/codelens" target="_blank" rel="noreferrer"
          className="rounded hover:text-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">View source on GitHub ↗</a>
      </div>
    </footer>
  );
}
