"use client";

import { useEffect, useRef } from "react";

export default function VantaCloudsBackground() {
  const backgroundRef = useRef(null);

  useEffect(() => {
    const element = backgroundRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let effect;
    let visible = false;
    let disposed = false;
    let generation = 0;

    const stop = () => {
      generation += 1;
      effect?.destroy();
      effect = null;
    };

    const start = async () => {
      if (!visible || reducedMotion.matches || effect || disposed) return;
      const currentGeneration = ++generation;
      try {
        const [THREE, cloudsModule] = await Promise.all([
          import("three"),
          import("vanta/dist/vanta.clouds.min"),
        ]);
        if (disposed || !visible || reducedMotion.matches || generation !== currentGeneration) {
          return;
        }

        effect = cloudsModule.default({
          el: element,
          THREE,
          mouseControls: false,
          touchControls: false,
          gyroControls: false,
          minHeight: 200,
          minWidth: 200,
          scale: 2,
          scaleMobile: 4,
          speed: 0.5,
          backgroundColor: 0x0a171d,
          skyColor: 0x174c4a,
          cloudColor: 0x48827a,
          cloudShadowColor: 0x092b30,
          sunColor: 0x5be0bf,
          sunGlareColor: 0x2ba88e,
          sunlightColor: 0x64bda6,
        });
      } catch (error) {
        console.error("Unable to initialize the Vanta CLOUDS background.", error);
      }
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        void start();
      } else {
        stop();
      }
    });
    observer.observe(element);

    const handleMotionChange = () => {
      if (reducedMotion.matches) {
        stop();
      } else {
        void start();
      }
    };
    reducedMotion.addEventListener("change", handleMotionChange);

    return () => {
      disposed = true;
      observer.disconnect();
      reducedMotion.removeEventListener("change", handleMotionChange);
      stop();
    };
  }, []);

  return (
    <div
      ref={backgroundRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
    />
  );
}
