"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CAPTURE_STEPS } from "@/lib/capture-steps";
import { captureVideoFrame, compressImage } from "@/lib/compress-image";

type CameraStatus = "starting" | "ready" | "error";

export default function CapturePage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<(string | null)[]>(
    Array(CAPTURE_STEPS.length).fill(null)
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("starting");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const activeStep = CAPTURE_STEPS[activeIndex];
  const currentPhoto = photos[activeIndex];
  const allCaptured = photos.every((photo) => photo !== null);

  useEffect(() => {
    if (allCaptured) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      return;
    }
    if (streamRef.current) return;

    let cancelled = false;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraStatus("error");
        return;
      }
      setCameraStatus("starting");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCameraStatus("ready");
      } catch {
        if (!cancelled) setCameraStatus("error");
      }
    }

    startCamera();

    return () => {
      cancelled = true;
    };
  }, [allCaptured]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  function storePhoto(dataUrl: string) {
    setPhotos((prev) => {
      const next = [...prev];
      next[activeIndex] = dataUrl;
      return next;
    });
    setActiveIndex((prev) => Math.min(prev + 1, CAPTURE_STEPS.length - 1));
  }

  function handleCapture() {
    if (!videoRef.current) return;
    storePhoto(captureVideoFrame(videoRef.current));
  }

  function handleRetake() {
    setPhotos((prev) => {
      const next = [...prev];
      next[activeIndex] = null;
      return next;
    });
  }

  async function handleUploadChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      storePhoto(await compressImage(file));
    } catch {
      setUploadError("Couldn't process that photo. Please try again.");
    } finally {
      setIsUploading(false);
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

          <div className="relative mt-5 aspect-square w-full max-w-xs overflow-hidden rounded-xl border border-dashed border-zinc-300 bg-zinc-950 dark:border-zinc-700">
            <video
              ref={videoRef}
              muted
              playsInline
              className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
            />
            {currentPhoto && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentPhoto}
                alt={activeStep.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            {!currentPhoto && cameraStatus === "starting" && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 text-sm text-zinc-300">
                Starting camera…
              </div>
            )}
            {!currentPhoto && cameraStatus === "error" && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 px-4 text-center text-sm text-zinc-300">
                Camera unavailable. Use &quot;Upload photo instead&quot; below.
              </div>
            )}
          </div>

          {currentPhoto ? (
            <button
              onClick={handleRetake}
              className="mt-5 inline-flex h-11 w-full max-w-xs items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Retake photo
            </button>
          ) : (
            <button
              onClick={handleCapture}
              disabled={cameraStatus !== "ready"}
              className="mt-5 inline-flex h-11 w-full max-w-xs items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Capture
            </button>
          )}

          <input
            ref={uploadInputRef}
            type="file"
            accept="image/*"
            onChange={handleUploadChange}
            className="hidden"
          />
          <button
            onClick={() => uploadInputRef.current?.click()}
            disabled={isUploading}
            className="mt-3 text-sm font-medium text-zinc-500 underline-offset-2 hover:underline disabled:opacity-50 dark:text-zinc-400"
          >
            {isUploading ? "Processing…" : "Upload photo instead"}
          </button>
          {uploadError && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">
              {uploadError}
            </p>
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
