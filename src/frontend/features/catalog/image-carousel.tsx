"use client";

import { useRef, useState } from "react";

export function ImageCarousel({
  images,
  alt,
  onImageClick
}: {
  images: string[];
  alt: string;
  onImageClick?: (index: number) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  if (images.length === 0) return null;

  if (images.length === 1) {
    return onImageClick ? (
      <button
        className="product-image-button"
        type="button"
        onClick={() => onImageClick(0)}
        aria-label={`Open full image for ${alt}`}
      >
        <img className="product-image" src={images[0]} alt={alt} loading="lazy" />
      </button>
    ) : (
      <img className="product-image" src={images[0]} alt={alt} loading="lazy" />
    );
  }

  function handleScroll() {
    const track = trackRef.current;
    if (!track) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    setActiveIndex(index);
  }

  function scrollToIndex(index: number) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="carousel">
      <div className="carousel-track" ref={trackRef} onScroll={handleScroll}>
        {images.map((src, i) => (
          <div key={i} className="carousel-slide">
            {onImageClick ? (
              <button
                className="product-image-button"
                type="button"
                onClick={() => onImageClick(i)}
                aria-label={`Open full image ${i + 1} for ${alt}`}
                style={{ margin: 0, borderRadius: 0 }}
              >
                <img src={src} alt={`${alt} ${i + 1}`} loading="lazy" />
              </button>
            ) : (
              <img src={src} alt={`${alt} ${i + 1}`} loading="lazy" />
            )}
          </div>
        ))}
      </div>
      <div className="carousel-dots">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`carousel-dot${i === activeIndex ? " active" : ""}`}
            aria-label={`Go to image ${i + 1}`}
            onClick={() => scrollToIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}
