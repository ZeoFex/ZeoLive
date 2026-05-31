import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/landing/section-heading";
import { testimonialPhotos } from "@/lib/site-images";
import { testimonials } from "@/lib/mock-data";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Testimonials() {
  return (
    <section className="border-t bg-muted/40 py-16 px-4 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading title="Notes from students and parents" />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => {
            const photo = testimonialPhotos[t.id];
            return (
              <Card key={t.id} className="shadow-none">
                <CardContent className="p-6">
                  <p className="text-sm leading-relaxed text-foreground">{t.content}</p>
                  <div className="mt-6 flex items-center gap-3 border-t pt-4">
                    <Avatar className="h-10 w-10">
                      {photo && <AvatarImage src={photo.src} alt={photo.alt} />}
                      <AvatarFallback className="bg-muted text-xs font-medium">
                        {initials(t.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
