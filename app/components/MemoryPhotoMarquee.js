"use client";

import { useEffect, useRef, useState } from "react";
import PortfolioImage from "./PortfolioImage";
import styles from "./MemoryPhotoMarquee.module.css";

export default function MemoryPhotoMarquee({ images, title, onOpen }) {
  const viewportRef = useRef(null);
  const photosRef = useRef(null);
  const trackRef = useRef(null);
  const [dimensions, setDimensions] = useState({ cycle: 0, viewport: 0 });
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const viewport = viewportRef.current;
    const photos = photosRef.current;
    if (!viewport || !photos) return undefined;

    const measure = () => {
      setDimensions({ cycle: photos.offsetWidth, viewport: viewport.clientWidth });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(photos);
    measure();
    return () => observer.disconnect();
  }, []);

  const overflowing = dimensions.cycle - 12 > dimensions.viewport && dimensions.viewport > 0;
  const running = overflowing;

  function movePhotos(direction) {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const animation = track.getAnimations()[0];
    if (animation && typeof animation.currentTime === "number") {
      const duration = dimensions.cycle / 22 * 1000;
      const step = duration / images.length;
      animation.currentTime = (animation.currentTime + direction * step + duration) % duration;
    } else {
      viewport.scrollLeft += direction * dimensions.cycle / images.length;
    }
    setPaused(true);
  }

  const renderPhotos = (duplicate) => images.map((image, index) => (
    <button
      key={image.publicId || image.url}
      type="button"
      tabIndex={duplicate ? -1 : undefined}
      onPointerDown={duplicate ? (event) => event.preventDefault() : undefined}
      onClick={() => onOpen(index)}
      aria-label={duplicate ? undefined : `View ${title} photo ${index + 1}`}
      className={`${styles.photo} cursor-zoom-in overflow-hidden rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#168e78]`}
    >
      <PortfolioImage
        url={image.url}
        alt={duplicate ? "" : `${title}, photo ${index + 1}`}
        className="aspect-square w-full transition duration-300 hover:scale-105"
      />
    </button>
  ));

  return (
    <div className="mt-5">
      {overflowing && (
        <div className="mb-2 flex justify-end">
          <div className="flex items-center gap-1 rounded-full border border-[#b8e8d7] bg-gradient-to-r from-[#f3fcf8] to-[#e3f6ed] p-1 dark:border-[#2d705f] dark:from-[#123a31] dark:to-[#102127]">
            <button
              type="button"
              onClick={() => movePhotos(-1)}
              aria-label={`Previous ${title} photos`}
              title="Previous photos"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#38675d] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#168e78] dark:text-[#a9ead9] dark:hover:bg-white/10"
            >
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setPaused(!paused)}
              aria-label={`${paused ? "Play" : "Pause"} ${title} photos`}
              title={paused ? "Play photos" : "Pause photos"}
              className={`${styles.motionControl} flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#168e78] shadow-sm transition hover:bg-[#e1f1ec] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#168e78] dark:bg-[#274744] dark:text-[#a9ead9] dark:hover:bg-[#315650]`}
            >
              {paused ? (
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5.5v13l10-6.5z" />
                </svg>
              ) : (
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={() => movePhotos(1)}
              aria-label={`Next ${title} photos`}
              title="Next photos"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#38675d] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#168e78] dark:text-[#a9ead9] dark:hover:bg-white/10"
            >
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      )}
      <div
        ref={viewportRef}
        className={`${styles.viewport} ${running ? styles.running : ""} ${paused ? styles.paused : ""}`}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget) && running && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            event.currentTarget.scrollLeft = 0;
          }
        }}
      >
        <div ref={trackRef} className={styles.track} style={{ "--marquee-duration": `${dimensions.cycle / 22}s` }}>
          <div ref={photosRef} className={styles.photos}>
            {renderPhotos(false)}
          </div>
          {running && (
            <div className={`${styles.photos} ${styles.duplicate}`} aria-hidden="true">
              {renderPhotos(true)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
