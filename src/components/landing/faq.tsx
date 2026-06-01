import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeading } from "@/components/landing/section-heading";
import type { LandingCms } from "@/lib/cms-types";

export function FAQ({ content }: { content: LandingCms["faq"] }) {
  return (
    <section id="faq" className="border-t px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-2xl">
        <SectionHeading
          title={content.heading.title}
          description={content.heading.description}
        />
        <Accordion type="single" collapsible className="mt-10">
          {content.items.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id}>
              <AccordionTrigger className="text-left text-sm font-medium">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
