"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CAPTURE_STEPS } from "@/lib/capture-steps";
import { compressImage } from "@/lib/compress-image";

export default function CapturePage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<(string | null)[]>(
    Array(CAPTURE_STEPS.length).fill(null)
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeStep = CAPTURE_STEPS[activeIndex];
  const allCaptured = photos.every((photo) => photo !== null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    try {
      const dataUrl = await compressImage(file);
      setPhotos((prev) => {
        const next = [...prev];
        next[activeIndex] = dataUrl;
        return next;
      });
      setActiveIndex((prev) => Math.min(prev + 1, CAPTURE_STEPS.length - 1));
    } catch {
      setError("Couldn't process that photo. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }

  function handleContinue() {
    sessionStorage.setItem("toothpaste-cv:photos", JSON.stringify(photos));
    router.push("/report");
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 dark:bg-black">
      <main className="flex w-full max-w-md flex-1 flex-col px-6 py-10">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            ← Back
          </Link>
          <span className="text-sm font-medium text-zinc-500">
            Step {activeIndex + 1} of {CAPTURE_STEPS.length}
          </span>
        </div>

        <div className="mt-6 flex gap-2">
          {CAPTURE_STEPS.map((step, i) => (
            <button
              key={step.id}
              onClick={() => setActiveIndex(i)}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                photos[i]
                  ? "bg-emerald-500"
                  : i === activeIndex
                    ? "bg-zinc-400"
                    : "bg-zinc-200 dark:bg-zinc-800"
              }`}
              aria-label={`Go to ${step.title}`}
            />
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <h1 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            {activeStep.title}
          </h1>
          <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {activeStep.instruction}
          </p>

          <div className="mt-5 flex aspect-square w-full max-w-xs items-center justify-center overflow-hidden rounded-xl border border-dashed border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900">
            {photos[activeIndex] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photos[activeIndex]!}
                alt={activeStep.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm text-zinc-400">No photo yet</span>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="mt-5 inline-flex h-11 w-full max-w-xs items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {isProcessing
              ? "Processing…"
              : photos[activeIndex]
                ? "Retake photo"
                : "Take photo"}
          </button>
          {error && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>

        <div className="mt-6 flex justify-center gap-2">
          {CAPTURE_STEPS.map((step, i) => (
            <button
              key={step.id}
              onClick={() => setActiveIndex(i)}
              className={`h-14 w-14 overflow-hidden rounded-lg border-2 ${
                i === activeIndex
                  ? "border-zinc-950 dark:border-zinc-50"
                  : "border-transparent"
              }`}
              aria-label={`Review ${step.title}`}
            >
              {photos[i] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photos[i]!}
                  alt={step.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-xs text-zinc-400 dark:bg-zinc-900">
                  {i + 1}
                </div>
              )}
            </button>
          ))}
        </div>

        {allCaptured && (
          <button
            onClick={handleContinue}
            className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-full bg-emerald-600 px-8 text-base font-medium text-white transition-colors hover:bg-emerald-500"
          >
            Continue to report
          </button>
        )}
      </main>
    </div>
  );
}
