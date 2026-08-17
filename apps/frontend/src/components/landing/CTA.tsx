import Link from "next/link";

export default function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-28">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="text-3xl font-medium tracking-tight text-ink-50 md:text-4xl">
          Ask your cluster anything.
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-ink-300">
          The cluster is already running. See it answer for itself.
        </p>
        <div className="mt-8">
          <Link
            href="/dashboard"
            className="rounded-full bg-ink-50 px-6 py-3 text-sm font-medium text-ink-950 transition hover:bg-ink-100 active:scale-[0.98]"
          >
            Open dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}
