import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { LandingImage } from "@/components/shared/landing-image";
import { tutorPhotos } from "@/lib/site-images";
import { formatCurrency } from "@/lib/utils";
import type { Tutor } from "@/types";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface TutorCardProps {
  tutor: Tutor;
  showBook?: boolean;
  /** Photo header layout for marketing pages */
  variant?: "compact" | "photo";
}

export function TutorCard({
  tutor,
  showBook = true,
  variant = "compact",
}: TutorCardProps) {
  const photo = tutorPhotos[tutor.id] ?? (tutor.avatar ? { src: tutor.avatar, alt: tutor.name } : null);

  if (variant === "photo" && photo) {
    return (
      <Card className="overflow-hidden shadow-none">
        <LandingImage
          src={photo.src}
          alt={photo.alt}
          className="aspect-[4/3] w-full border-b"
          sizes="(max-width: 640px) 100vw, 280px"
        />
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium text-foreground">{tutor.name}</h3>
            {tutor.verified && (
              <Badge variant="secondary" className="font-normal">
                Verified
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{tutor.subject}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {tutor.rating} · {tutor.reviewCount} reviews
          </p>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="font-medium tabular-nums">
              {formatCurrency(tutor.hourlyRate)}
              <span className="font-normal text-muted-foreground"> / hr</span>
            </span>
            <span className="text-muted-foreground">
              {tutor.available ? "Open slots" : "Fully booked"}
            </span>
          </div>
        </CardContent>
        {showBook && (
          <CardFooter className="border-t px-5 py-3">
            <Button className="w-full" variant="outline" size="sm" asChild>
              <Link href="/student/book">Book session</Link>
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  }

  return (
    <Card className="shadow-none">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <Avatar className="h-11 w-11">
            {photo ? (
              <AvatarImage src={photo.src} alt={photo.alt} />
            ) : null}
            <AvatarFallback className="bg-muted text-xs font-medium">
              {initials(tutor.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium text-foreground">{tutor.name}</h3>
              {tutor.verified && (
                <Badge variant="secondary" className="font-normal">
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{tutor.subject}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {tutor.rating} · {tutor.reviewCount} reviews
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="font-medium tabular-nums">
            {formatCurrency(tutor.hourlyRate)}
            <span className="font-normal text-muted-foreground"> / hr</span>
          </span>
          <span className="text-muted-foreground">
            {tutor.available ? "Open slots" : "Fully booked"}
          </span>
        </div>
      </CardContent>
      {showBook && (
        <CardFooter className="border-t px-5 py-3">
          <Button className="w-full" variant="outline" size="sm" asChild>
            <Link href="/student/book">Book session</Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
