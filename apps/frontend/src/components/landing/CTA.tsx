import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CTA() {
  return (
    <section className="px-6 py-32 text-center md:py-40">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-4xl font-medium tracking-tight text-foreground md:text-5xl">
          The cluster is already running.
        </h2>
        <div className="mt-10">
          <Button asChild size="lg">
            <Link href="/dashboard">Open dashboard</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
