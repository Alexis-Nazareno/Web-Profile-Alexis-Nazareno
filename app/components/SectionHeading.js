export default function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="max-w-3xl">
      {eyebrow && (
        <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#168e78] dark:text-[#5be0bf]">
          {eyebrow}
        </p>
      )}
      <h1 className="text-4xl font-semibold leading-tight tracking-[-0.04em] text-[#102027] dark:text-white sm:text-5xl md:text-6xl">
        {title}
      </h1>
      {description && (
        <p className="mt-5 max-w-2xl text-base leading-7 text-[#607078] dark:text-white/65 sm:text-lg sm:leading-8">
          {description}
        </p>
      )}
    </div>
  );
}
