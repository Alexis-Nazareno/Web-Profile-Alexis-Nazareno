"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function PortfolioImage({
  url,
  alt,
  className = "",
  fallbackText = "AN",
  fallbackClassName = "text-5xl font-semibold tracking-tight",
  objectFit = "cover",
  transparent = false,
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  if (!url || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`relative grid place-items-center overflow-hidden bg-[#dceee9] text-[#12332f] dark:bg-[#16332f] dark:text-[#a9ead9] ${className}`}
      >
        <div
          aria-hidden="true"
          className="absolute -right-10 -top-12 h-40 w-40 rounded-full border border-current/10"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full border border-current/10"
        />
        <span className={`relative ${fallbackClassName}`}>
          {fallbackText}
        </span>
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className={`relative overflow-hidden ${transparent ? "" : "bg-[#dceee9] dark:bg-[#16332f]"} ${className}`}
    >
      <Image
        src={url}
        alt=""
        fill
        unoptimized
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
        className={objectFit === "contain" ? "object-contain" : "object-cover"}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
