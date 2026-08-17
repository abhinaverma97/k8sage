import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-28">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="text-3xl font-medium tracking-tight text-foreground md:text-4xl">
          Ask your cluster anything.
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          The cluster is already running. See it answer for itself.
        </p>
        <div className="mt-8">
          <Button asChild size="lg">
            <Link href="/dashboard">Open dashboard</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
