import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqs } from "@/lib/mock-data";
import { SectionHeading } from "@/components/landing/section-heading";

export function FAQ() {
  return (
    <section id="faq" className="border-t py-16 px-4 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-2xl">
        <SectionHeading
          title="Common questions"
          description="Reach support from your account if something isn’t covered here."
        />
        <Accordion type="single" collapsible className="mt-10">
          {faqs.map((faq) => (
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
