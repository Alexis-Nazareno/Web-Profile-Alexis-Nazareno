"use client";

export default function PortfolioFileLink({
  href,
  children,
  className = "",
}) {
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}
