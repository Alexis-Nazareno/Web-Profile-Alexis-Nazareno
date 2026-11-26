"use client";

import { useEffect, useRef } from "react";

const getThemeOptions = () => {
  const isDark = document.documentElement.classList.contains("dark");

  return {
    backgroundColor: isDark ? 0x07192f : 0xf7faf9,
    backgroundAlpha: 0,
    color1: isDark ? 0x23a98c : 0x07503f,
    color2: isDark ? 0x5be0bf : 0x0b7052,
  };
};

function supportsBirds() {
  const canvas = document.createElement("canvas");
  const webgl2 = canvas.getContext("webgl2");
  const gl = webgl2 || canvas.getContext("webgl");
  if (!gl) return false;

  const supported =
    (!!webgl2 || !!gl.getExtension("OES_texture_float")) &&
    gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) > 0;
  gl.getExtension("WEBGL_lose_context")?.loseContext();
  return supported;
}

export default function VantaBirdsBackground() {
  const backgroundRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let effect;
    let revealTimer;
    let isDisposed = false;

    const destroyEffect = () => {
      if (!effect) return;
      const renderer = effect.renderer;
      if (renderer?.domElement?.parentNode !== effect.el) {
        effect.renderer = null;
      }
      effect.destroy();
      renderer?.dispose();
      effect = null;
    };

    const initializeBackground = async () => {
      if (!supportsBirds()) {
        console.warn("Vanta BIRDS background unavailable: required WebGL features are not supported.");
        return;
      }

      const THREE = await import("three");
      const previousThree = window.THREE;
      window.THREE = THREE;

      let birdsModule;
      try {
        birdsModule = await import("vanta/dist/vanta.birds.min");
      } finally {
        if (previousThree === undefined) {
          delete window.THREE;
        } else {
          window.THREE = previousThree;
        }
      }

      if (isDisposed || !backgroundRef.current) return;

      backgroundRef.current.style.opacity = "0";
      backgroundRef.current.style.transition = "opacity 600ms ease";
      effect = birdsModule.default({
        el: backgroundRef.current,
        THREE,
        ...getThemeOptions(),
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200,
        minWidth: 200,
        scale: 1,
        scaleMobile: 1,
        colorMode: "varianceGradient",
        quantity: 4,
        birdSize: 0.75,
        wingSpan: 14,
        speedLimit: 3,
        separation: 35,
        alignment: 25,
        cohesion: 1,
      });

      const velocityMaterial = effect.velocityVariable?.material;
      if (!velocityMaterial || !effect.camera) {
        console.warn("Vanta BIRDS background unavailable: initialization did not complete.");
        destroyEffect();
        return;
      }
      const centerDeclaration = "vec3 central = vec3( 0., 0., 0. );";
      const centerAttraction = "velocity -= normalize( dir ) * delta * 5.;";
      if (
        !velocityMaterial.fragmentShader.includes(centerDeclaration) ||
        !velocityMaterial.fragmentShader.includes(centerAttraction)
      ) {
        throw new Error("The Vanta Birds flock shader could not be positioned.");
      }

      velocityMaterial.fragmentShader = velocityMaterial.fragmentShader
        .replace(
          centerDeclaration,
          "vec3 central = vec3( 280. + sin(time * 0.00015) * 80., 260., 0. );",
        )
        .replace(centerAttraction, "velocity -= normalize( dir ) * delta * 20.;");
      velocityMaterial.needsUpdate = true;
      effect.camera.position.y = -40;

      revealTimer = window.setTimeout(() => {
        if (backgroundRef.current && !isDisposed) {
          backgroundRef.current.style.opacity = "1";
        }
      }, 5000);
    };

    initializeBackground().catch((error) => {
      destroyEffect();
      console.error("Unable to initialize the Vanta BIRDS background.", error);
    });

    const themeObserver = new MutationObserver(() => {
      effect?.setOptions(getThemeOptions());
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      isDisposed = true;
      window.clearTimeout(revealTimer);
      themeObserver.disconnect();
      destroyEffect();
    };
  }, []);

  return (
    <div
      ref={backgroundRef}
      aria-hidden="true"
      className="absolute inset-0 z-0"
    />
  );
}
