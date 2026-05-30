import { Link } from '@tanstack/react-router';
import { ArrowRight, CheckCircle2, type LucideIcon } from 'lucide-react';

/** ===== 공통 promo 컴포넌트 =====
 *  TeacherAdmin _components 패턴을 TanStack Router로 복제.
 */

export function PromoHero({
  badge,
  title,
  highlight,
  body,
  primaryHref = '/',
  primaryLabel = '시작하기',
  secondaryHref,
  secondaryLabel,
  Icon,
}: {
  badge?: string;
  title: string;
  highlight?: string;
  body: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  Icon?: LucideIcon;
}) {
  const isExternalPrimary = /^https?:\/\//.test(primaryHref);
  const isExternalSecondary = secondaryHref ? /^https?:\/\//.test(secondaryHref) : false;

  return (
    <section className="via-background to-background relative overflow-hidden bg-gradient-to-br from-indigo-50">
      <div className="mx-auto max-w-5xl px-6 py-16 text-center sm:px-12 sm:py-24">
        {badge && (
          <div className="bg-card text-muted-foreground mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
            {Icon && <Icon className="text-primary h-3.5 w-3.5" />}
            {badge}
          </div>
        )}
        <h1 className="text-foreground text-4xl font-bold tracking-tight sm:text-5xl">
          {title}
          {highlight && <span className="text-primary"> {highlight}</span>}
        </h1>
        <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg">{body}</p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {isExternalPrimary ? (
            <a
              href={primaryHref}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-xl px-6 py-3 text-base font-semibold shadow-sm transition-opacity hover:opacity-90"
            >
              {primaryLabel}
              <ArrowRight className="h-4 w-4" />
            </a>
          ) : (
            <Link
              to={primaryHref}
              className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-xl px-6 py-3 text-base font-semibold shadow-sm transition-opacity hover:opacity-90"
            >
              {primaryLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          {secondaryHref &&
            (isExternalSecondary ? (
              <a
                href={secondaryHref}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-background text-foreground hover:bg-accent inline-flex items-center rounded-xl border px-6 py-3 text-base font-medium transition-colors"
              >
                {secondaryLabel || '더 알아보기'}
              </a>
            ) : (
              <Link
                to={secondaryHref}
                className="bg-background text-foreground hover:bg-accent inline-flex items-center rounded-xl border px-6 py-3 text-base font-medium transition-colors"
              >
                {secondaryLabel || '더 알아보기'}
              </Link>
            ))}
        </div>
      </div>
    </section>
  );
}

export function PromoSection({
  title,
  subtitle,
  children,
  tone = 'default',
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  tone?: 'default' | 'muted';
}) {
  return (
    <section
      className={
        tone === 'muted'
          ? 'bg-secondary/30 px-6 py-16 sm:px-12 sm:py-20'
          : 'px-6 py-16 sm:px-12 sm:py-20'
      }
    >
      <div className="mx-auto max-w-6xl">
        {(title || subtitle) && (
          <div className="text-center">
            {title && (
              <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
                {title}
              </h2>
            )}
            {subtitle && <p className="text-muted-foreground mx-auto mt-4 max-w-2xl">{subtitle}</p>}
          </div>
        )}
        <div className={title || subtitle ? 'mt-12' : ''}>{children}</div>
      </div>
    </section>
  );
}

export function FeatureGrid({
  items,
  columns = 3,
}: {
  items: { icon: LucideIcon; title: string; body: string }[];
  columns?: 2 | 3;
}) {
  const cols = columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3';
  return (
    <div className={`grid gap-4 ${cols}`}>
      {items.map((f) => {
        const Icon = f.icon;
        return (
          <div key={f.title} className="bg-card rounded-2xl border p-5">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-foreground text-base font-semibold">{f.title}</h3>
                <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{f.body}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function StepList({ steps }: { steps: { title: string; body: string }[] }) {
  return (
    <ol className="space-y-4">
      {steps.map((s, i) => (
        <li key={s.title} className="bg-card flex gap-4 rounded-2xl border p-5">
          <div className="bg-primary text-primary-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold">
            {i + 1}
          </div>
          <div>
            <h3 className="text-foreground text-base font-semibold">{s.title}</h3>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {items.map((r) => (
        <li
          key={r}
          className="bg-card text-foreground flex items-start gap-2 rounded-xl border px-4 py-3 text-sm"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
          <span>{r}</span>
        </li>
      ))}
    </ul>
  );
}

export function FinalCTA({
  title,
  body,
  Icon,
  primaryHref = '/',
  primaryLabel = '시작하기',
}: {
  title: string;
  body: string;
  Icon: LucideIcon;
  primaryHref?: string;
  primaryLabel?: string;
}) {
  const isExternal = /^https?:\/\//.test(primaryHref);
  return (
    <section className="mx-auto max-w-3xl px-6 py-16 text-center sm:px-12 sm:py-20">
      <div className="bg-primary/10 text-primary inline-flex h-12 w-12 items-center justify-center rounded-2xl">
        <Icon className="h-6 w-6" />
      </div>
      <h2 className="text-foreground mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </h2>
      <p className="text-muted-foreground mt-4">{body}</p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        {isExternal ? (
          <a
            href={primaryHref}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-xl px-6 py-3 text-base font-semibold shadow-sm transition-opacity hover:opacity-90"
          >
            {primaryLabel}
            <ArrowRight className="h-4 w-4" />
          </a>
        ) : (
          <Link
            to={primaryHref}
            className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-xl px-6 py-3 text-base font-semibold shadow-sm transition-opacity hover:opacity-90"
          >
            {primaryLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </section>
  );
}
