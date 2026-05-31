import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const footerLinks = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Tutors", href: "#tutors" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Blog", href: "#" },
  ],
  Support: [
    { label: "Help center", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Privacy", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="text-base font-semibold">
              ZoeLive
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Scheduling, classrooms, and payouts for tutors working with
              students online.
            </p>
            <p className="mt-6 text-sm text-muted-foreground">
              contact@zoelive.com
            </p>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-medium">{title}</h4>
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="text-sm font-medium">Updates</h4>
            <p className="mt-2 text-sm text-muted-foreground">
              Occasional product news. No spam.
            </p>
            <form className="mt-3 flex gap-2" action="#">
              <Input type="email" placeholder="Email" aria-label="Email" className="h-9" />
              <Button type="submit" size="sm" variant="secondary">
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        <p className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} ZoeLive
        </p>
      </div>
    </footer>
  );
}
