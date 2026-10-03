import type { ReactNode } from 'react'

import { Logo } from '@/components/common/Logo'

export function AuthLayout({ eyebrow, title, subtitle, children }: { eyebrow: string; title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden border-r bg-card lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Logo />
        <div className="max-w-md">
          <p className="eyebrow mb-4">One recovery. One timeline. One source of truth.</p>
          <p className="font-display text-6xl font-bold uppercase leading-[0.9]">
            Every day of your comeback, <span className="text-volt">in one place.</span>
          </p>
          <p className="mt-6 text-muted-foreground">
            Check-ins, rehab, milestones and your whole support team — physio, S&amp;C, coach, doctor — on the same page.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Recovery tracking, not medical diagnosis.</p>
      </section>
      <section className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>
          <p className="eyebrow mb-3">{eyebrow}</p>
          <h1 className="font-display text-4xl font-bold uppercase leading-none">{title}</h1>
          {subtitle && <p className="mt-3 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </div>
  )
}
