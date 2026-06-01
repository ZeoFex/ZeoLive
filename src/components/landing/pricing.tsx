import { Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/landing/section-heading";
import type { LandingCms } from "@/lib/cms-types";
import { cn, formatCurrency } from "@/lib/utils";

export function Pricing({ content }: { content: LandingCms["pricing"] }) {
  return (
    <section id="pricing" className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          title={content.heading.title}
          description={content.heading.description}
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {content.plans.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                "h-full shadow-none",
                plan.popular && "border-foreground/20"
              )}
            >
              <CardHeader>
                <div className="flex items-baseline justify-between gap-2">
                  <CardTitle className="text-lg font-medium">{plan.name}</CardTitle>
                  {plan.popular && (
                    <span className="text-xs font-medium text-muted-foreground">
                      Common choice
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-semibold tabular-nums">
                    {plan.price === 0 ? "Free" : formatCurrency(plan.price)}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-sm text-muted-foreground"> / {plan.period}</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2 text-sm text-muted-foreground">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-foreground"
                        strokeWidth={1.75}
                      />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  asChild
                >
                  <Link
                    href={plan.id === "tutor" ? "/signup/tutor" : "/signup/student"}
                  >
                    {plan.cta}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
