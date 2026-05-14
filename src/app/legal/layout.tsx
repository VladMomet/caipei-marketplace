import type { ReactNode } from 'react'

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <article className="container mx-auto max-w-3xl px-6 py-16 lg:py-24">
      <div className="prose-yi">{children}</div>
      <style>{`
        .prose-yi h1 { font-family: var(--font-mona), system-ui, sans-serif; font-weight: 400; font-size: 2.5rem; line-height: 1.05; letter-spacing: -0.02em; margin-bottom: 1.5rem; }
        .prose-yi h2 { font-family: var(--font-mona), system-ui, sans-serif; font-weight: 500; font-size: 1.5rem; line-height: 1.2; margin-top: 2.5rem; margin-bottom: 1rem; }
        .prose-yi p { color: #2A2926; font-size: 1rem; line-height: 1.7; margin-bottom: 1rem; }
        .prose-yi ul { margin: 1rem 0; padding-left: 0; list-style: none; }
        .prose-yi li { color: #2A2926; font-size: 1rem; line-height: 1.7; padding-left: 1.5rem; position: relative; }
        .prose-yi li::before { content: '·'; color: #EE4523; font-weight: bold; position: absolute; left: 0.5rem; }
        .prose-yi a { color: #EE4523; text-decoration: underline; text-underline-offset: 2px; }
        .prose-yi .meta { color: #6E6B65; font-family: var(--font-jetbrains), monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #E5E1D8; }
        .prose-yi .warning { color: #DE6B1F; font-size: 0.875rem; line-height: 1.6; margin-top: 2rem; padding: 1rem 1.25rem; border: 1px solid #DE6B1F33; border-radius: 12px; background: #FBFAF6; }
      `}</style>
    </article>
  )
}
