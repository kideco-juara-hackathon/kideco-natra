"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

type LoginCarouselSlide = {
  id: string;
  alt: string;
  src: string;
  title: string;
  description: string;
};

const loginSlides: LoginCarouselSlide[] = [
  {
    id: "hauling-01",
    alt: "Kideco hauling operation visual",
    src: "/carousel/1.jpeg",
    title: "Hauling & Operations Control",
    description: "Pengiriman real-time dan sinkronisasi hauling otomatis.",
  },
  {
    id: "dispatch-01",
    alt: "Kideco dispatcher operation visual",
    src: "/carousel/2.webp",
    title: "Jetty Command Center",
    description: "Dukungan keputusan operasional untuk transportasi batu bara optimal.",
  },
  {
    id: "route-01",
    alt: "Kideco route intelligence visual",
    src: "/carousel/3.jpg",
    title: "Route Intelligence",
    description: "Perencanaan jalur prediktif dan pelacakan efisiensi bahan bakar.",
  },
];

export function LoginCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % loginSlides.length);
    }, 4200);

    return () => window.clearInterval(interval);
  }, []);

  const activeSlide = loginSlides[activeIndex];

  return (
    <section className="absolute inset-y-0 right-0 hidden overflow-hidden bg-[#211917] md:left-[50%] md:block">
      <style>{`
        @keyframes carousel-slide-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .carousel-text-enter {
          animation: carousel-slide-up 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>

      {/* All slides rendered simultaneously — crossfade via opacity transition */}
      {loginSlides.map((slide, index) => (
        <Image
          key={slide.id}
          alt={slide.alt}
          className={cn(
            "object-cover transition-opacity duration-700",
            index === activeIndex ? "opacity-100" : "opacity-0",
          )}
          fill
          priority={index === 0}
          sizes="(min-width: 768px) 58vw, 100vw"
          src={slide.src}
        />
      ))}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />

      {/* Text — key forces re-mount on slide change, triggering slide-up animation */}
      <div
        key={activeIndex}
        className="carousel-text-enter absolute bottom-10 left-8 right-8 z-10 flex flex-col items-center text-center text-white"
      >
        <h2 className="mb-2 text-xl font-bold tracking-tight">
          {activeSlide.title}
        </h2>
        <p className="mb-6 max-w-[320px] text-xs leading-relaxed text-white/70">
          {activeSlide.description}
        </p>

        {/* Slide indicators */}
        <div className="flex gap-2">
          {loginSlides.map((slide, index) => (
            <button
              aria-label={`Tampilkan gambar ${index + 1}`}
              className={cn(
                "h-[3px] rounded-full transition-all duration-400",
                index === activeIndex
                  ? "w-8 bg-white"
                  : "w-4 bg-white/30 hover:bg-white/50",
              )}
              key={slide.id}
              onClick={() => setActiveIndex(index)}
              type="button"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
