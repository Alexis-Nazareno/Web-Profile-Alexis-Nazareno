"use client";

import { useEffect, useRef, useState } from "react";
import PortfolioImage from "../components/PortfolioImage";
import MemoryPhotoMarquee from "../components/MemoryPhotoMarquee";
import RichTextContent from "../components/RichTextContent";
import CollectionHeader from "../components/CollectionHeader";
import usePublishedWork from "../components/usePublishedWork";
import { groupMemoryAlbums } from "../../lib/workMemories.mjs";

function clampZoom(value) {
  return Math.min(3, Math.max(1, value));
}

export default function WorkMemoriesPage() {
  const { items, loading, error } = usePublishedWork("publicMemories");
  const companies = groupMemoryAlbums(items);
  const [preview, setPreview] = useState(null);
  const [zoom, setZoom] = useState(1);
  const dialogRef = useRef(null);
  const imageViewportRef = useRef(null);
  const zoomRef = useRef(1);
  const dragRef = useRef(null);
  const previewOpen = Boolean(preview);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    if (!previewOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [previewOpen]);

  useEffect(() => {
    const viewport = imageViewportRef.current;
    if (viewport && zoom > 1) {
      viewport.scrollLeft = (viewport.scrollWidth - viewport.clientWidth) / 2;
      viewport.scrollTop = (viewport.scrollHeight - viewport.clientHeight) / 2;
    }
  }, [zoom]);

  useEffect(() => {
    const viewport = imageViewportRef.current;
    if (!previewOpen || !viewport) return undefined;

    let lastTouch = null;
    let pinch = null;
    const distance = (touches) => Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY,
    );
    const onWheel = (event) => {
      if (event.ctrlKey || event.metaKey || !event.deltaY) return;
      event.preventDefault();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientHeight : 1);
      setZoom((current) => clampZoom(current * Math.exp(-delta * 0.002)));
    };
    const onTouchStart = (event) => {
      if (event.touches.length === 2) {
        pinch = { distance: distance(event.touches), zoom: zoomRef.current };
        lastTouch = null;
      } else if (event.touches.length === 1) {
        lastTouch = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      }
    };
    const onTouchMove = (event) => {
      event.preventDefault();
      if (event.touches.length === 2 && pinch && pinch.distance > 0) {
        setZoom(clampZoom(pinch.zoom * distance(event.touches) / pinch.distance));
      } else if (event.touches.length === 1 && lastTouch) {
        const touch = event.touches[0];
        viewport.scrollLeft += lastTouch.x - touch.clientX;
        viewport.scrollTop += lastTouch.y - touch.clientY;
        lastTouch = { x: touch.clientX, y: touch.clientY };
      }
    };
    const onTouchEnd = (event) => {
      pinch = null;
      lastTouch = event.touches.length === 1
        ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
        : null;
    };
    viewport.addEventListener("wheel", onWheel, { passive: false });
    viewport.addEventListener("touchstart", onTouchStart);
    viewport.addEventListener("touchmove", onTouchMove, { passive: false });
    viewport.addEventListener("touchend", onTouchEnd);
    viewport.addEventListener("touchcancel", onTouchEnd);
    return () => {
      viewport.removeEventListener("wheel", onWheel);
      viewport.removeEventListener("touchstart", onTouchStart);
      viewport.removeEventListener("touchmove", onTouchMove);
      viewport.removeEventListener("touchend", onTouchEnd);
      viewport.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [previewOpen]);

  function movePhoto(direction) {
    setPreview((current) => {
      if (!current) return current;
      const index = current.index + direction;
      if (index < 0 || index >= current.images.length) return current;
      return { ...current, index };
    });
    setZoom(1);
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
      <CollectionHeader
        eyebrow="Beyond work · Work memories"
        title="The moments behind the work."
        description="A collection of celebrations, people, and memories from the places where I've worked."
        count={!loading && !error ? items.length : 0}
        countLabel={items.length === 1 ? "album shared" : "albums shared"}
      />
      {loading ? (
        <p role="status" className="mt-12 text-sm text-[#65777a] dark:text-white/60">
          Loading work memories...
        </p>
      ) : error ? (
        <p role="alert" className="mt-12 rounded-2xl border border-[#efb2ad] bg-[#fff2f0] p-5 text-sm text-[#9f3026] dark:border-[#783c39] dark:bg-[#3a2020] dark:text-[#ffb9b2]">
          {error}
        </p>
      ) : companies.length ? (
        <div className="mt-12 space-y-14">
          {companies.map(([key, company]) => (
            <section key={key} aria-label={`${company.name} memories`}>
              <div className="mb-6 border-b border-[#dce7e4] pb-4 dark:border-white/10">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#168e78] dark:text-[#5be0bf]">
                  Company memories
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#183037] dark:text-white">
                  {company.name}
                </h2>
              </div>
              <div className="grid gap-6">
                {company.albums.map((album) => (
                  <article key={album.id} className="min-w-0 rounded-2xl border border-[#dce7e4] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#102127] sm:p-7">
                    {album.date && (
                      <p className="mb-2 text-xs font-medium text-[#168e78] dark:text-[#5be0bf]">
                        {album.date}
                      </p>
                    )}
                    <h3 className="text-xl font-semibold text-[#183037] dark:text-white">
                      {album.title}
                    </h3>
                    {album.description && (
                      <RichTextContent
                        content={album.description}
                        className="mt-3 text-sm leading-7 text-[#65777a] dark:text-white/65"
                      />
                    )}
                    {Array.isArray(album.images) && album.images.length > 0 && (
                      <MemoryPhotoMarquee
                        images={album.images}
                        title={album.title}
                        onOpen={(index) => {
                          setPreview({
                            images: album.images,
                            title: album.title,
                            index,
                          });
                          dialogRef.current?.showModal();
                        }}
                      />
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <p className="mt-12 rounded-2xl border border-dashed border-[#b8ccc5] px-6 py-12 text-center text-[#65777a] dark:border-white/15 dark:text-white/60">
          No work memories have been published yet.
        </p>
      )}
      <dialog
        ref={dialogRef}
        aria-labelledby="memory-preview-title"
        onClose={() => {
          setPreview(null);
          setZoom(1);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            dialogRef.current?.close();
          }
        }}
        onKeyDown={(event) => {
          if (event.altKey || event.ctrlKey || event.metaKey) return;
          if (event.key === "+" || event.key === "=" || event.key === "-" || event.key === "_") {
            event.preventDefault();
            setZoom((current) => clampZoom(current + (event.key === "+" || event.key === "=" ? 0.5 : -0.5)));
          } else if (event.key === "0") {
            event.preventDefault();
            setZoom(1);
          } else if (zoom === 1 && !event.shiftKey && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
            event.preventDefault();
            movePhoto(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}
        className="fixed inset-0 m-auto h-dvh max-h-none w-screen max-w-none items-start justify-center overflow-y-auto bg-transparent p-3 backdrop:bg-[#173b36]/20 open:flex sm:p-8"
      >
        {preview && (
          <div className="my-auto w-full max-w-5xl rounded-3xl border border-white/80 bg-white/95 p-3 text-[#183037] shadow-[0_24px_70px_rgba(16,54,48,0.2)] dark:border-white/10 dark:bg-[#102127]/95 dark:text-white dark:shadow-[0_24px_70px_rgba(0,0,0,0.35)] sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-4 px-1 sm:mb-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#168e78] dark:text-[#5be0bf]">
                  Work memories
                </p>
                <p id="memory-preview-title" className="mt-1 text-sm font-semibold sm:text-base">
                  {preview.title}{" "}
                  <span aria-live="polite" className="font-normal text-[#65777a] dark:text-white/60">
                    · Photo {preview.index + 1} of {preview.images.length}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                aria-label="Close photo preview"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#dce7e4] bg-[#f4f9f7] text-[#345650] transition hover:bg-[#e1f1ec] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#168e78] dark:border-white/15 dark:bg-white/5 dark:text-[#d9f3ec] dark:hover:bg-white/15 dark:focus-visible:outline-[#5be0bf]"
              >
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="relative">
              <div
                ref={imageViewportRef}
                tabIndex={0}
                role="region"
                aria-label="Photo viewer"
                aria-describedby="memory-zoom-help"
                onPointerDown={(event) => {
                  if (event.pointerType !== "mouse" || event.button !== 0 || zoom <= 1) return;
                  event.preventDefault();
                  dragRef.current = { x: event.clientX, y: event.clientY };
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                  if (!dragRef.current || event.pointerType !== "mouse") return;
                  event.currentTarget.scrollLeft += dragRef.current.x - event.clientX;
                  event.currentTarget.scrollTop += dragRef.current.y - event.clientY;
                  dragRef.current = { x: event.clientX, y: event.clientY };
                }}
                onPointerUp={() => { dragRef.current = null; }}
                onPointerCancel={() => { dragRef.current = null; }}
                onLostPointerCapture={() => { dragRef.current = null; }}
                className={`h-[min(60dvh,48rem)] w-full touch-none select-none overflow-auto rounded-2xl bg-[#eaf4f1] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#168e78] dark:bg-[#193238] dark:focus-visible:outline-[#5be0bf] ${zoom > 1 ? "cursor-grab active:cursor-grabbing" : ""}`}
              >
                <div style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}>
                  <PortfolioImage
                    url={preview.images[preview.index].url}
                    alt={`${preview.title}, photo ${preview.index + 1}`}
                    objectFit="contain"
                    transparent
                    className="h-full w-full"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => movePhoto(-1)}
                disabled={preview.index === 0}
                aria-label="Previous photo"
                className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#dce7e4] bg-white/95 text-[#24554c] shadow-md transition hover:bg-[#e1f1ec] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#168e78] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:bg-[#203c3d]/95 dark:text-[#e0f6ef] dark:hover:bg-[#315650] dark:focus-visible:outline-[#5be0bf] sm:left-4"
              >
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => movePhoto(1)}
                disabled={preview.index === preview.images.length - 1}
                aria-label="Next photo"
                className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#dce7e4] bg-white/95 text-[#24554c] shadow-md transition hover:bg-[#e1f1ec] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#168e78] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:bg-[#203c3d]/95 dark:text-[#e0f6ef] dark:hover:bg-[#315650] dark:focus-visible:outline-[#5be0bf] sm:right-4"
              >
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
            <p id="memory-zoom-help" className="mt-3 text-center text-xs text-[#65777a] dark:text-white/60">
              Scroll or pinch to zoom · Drag or swipe to move · Use + or - on the keyboard
            </p>
            <span className="sr-only" aria-live="polite">Zoom {Math.round(zoom * 100)}%</span>
          </div>
        )}
      </dialog>
    </div>
  );
}
