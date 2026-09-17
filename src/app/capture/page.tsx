"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, RotateCcw, Upload } from "lucide-react";
import { CAPTURE_STEPS } from "@/lib/capture-steps";
import { captureVideoFrame, compressImage } from "@/lib/compress-image";

type CameraStatus = "starting" | "ready" | "error";
type CaptureMode = "camera" | "upload";

function CornerBrackets() {
  const corners = [
    "top-2 left-2 border-t-2 border-l-2 rounded-tl-md",
    "top-2 right-2 border-t-2 border-r-2 rounded-tr-md",
    "bottom-2 left-2 border-b-2 border-l-2 rounded-bl-md",
    "bottom-2 right-2 border-b-2 border-r-2 rounded-br-md",
  ];
  return (
    <>
      {corners.map((classes) => (
        <div
          key={classes}
          aria-hidden
          className={`pointer-events-none absolute h-6 w-6 border-white/70 ${classes}`}
        />
      ))}
    </>
  );
}

function ModeTabs({
  mode,
  onChange,
}: {
  mode: CaptureMode;
  onChange: (mode: CaptureMode) => void;
}) {
  const tabs: { id: CaptureMode; label: string; icon: typeof Camera }[] = [
    { id: "camera", label: "Take a photo", icon: Camera },
    { id: "upload", label: "Upload photo", icon: Upload },
  ];
  return (
    <div className="flex gap-1 rounded-full bg-surface-page p-1">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
            mode === id
              ? "bg-accent text-accent-ink"
              : "text-ink-muted hover:text-ink-primary"
          }`}
        >
          <Icon className="h-4 w-4" strokeWidth={2.25} />
          {label}
        </button>
      ))}
    </div>
  );
}

export default function CapturePage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<(string | null)[]>(
    Array(CAPTURE_STEPS.length).fill(null)
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [mode, setMode] = useState<CaptureMode>("camera");
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

  function goToStep(index: number) {
    setActiveIndex(index);
    setMode("camera");
  }

  function storePhoto(dataUrl: string) {
    setPhotos((prev) => {
      const next = [...prev];
      next[activeIndex] = dataUrl;
      return next;
    });
    setActiveIndex((prev) => Math.min(prev + 1, CAPTURE_STEPS.length - 1));
    setMode("camera");
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
    <div className="flex flex-1 flex-col items-center bg-surface-page">
      <main className="flex w-full max-w-md flex-1 flex-col px-6 py-10">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-medium text-ink-muted transition-colors hover:text-ink-primary"
          >
            ← Back
          </Link>
          <span className="text-sm font-medium text-ink-muted">
            Step {activeIndex + 1} of {CAPTURE_STEPS.length}
          </span>
        </div>

        <div className="mt-6 flex gap-2">
          {CAPTURE_STEPS.map((step, i) => (
            <button
              key={step.id}
              onClick={() => goToStep(i)}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                photos[i]
                  ? "bg-status-good"
                  : i === activeIndex
                    ? "bg-accent"
                    : "bg-border-subtle"
              }`}
              aria-label={`Go to ${step.title}`}
            />
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center rounded-2xl border border-border-subtle bg-surface-card p-6 text-center">
          <h1 className="text-xl font-semibold text-ink-primary">
            {activeStep.title}
          </h1>
          <p className="mt-1 text-sm leading-6 text-ink-secondary">
            {activeStep.instruction}
          </p>

          <div className="mt-5 w-full max-w-xs">
            <ModeTabs mode={mode} onChange={setMode} />
          </div>

          <input
            ref={uploadInputRef}
            type="file"
            accept="image/*"
            onChange={handleUploadChange}
            className="hidden"
          />

          {mode === "camera" ? (
            <>
              <div className="relative mt-4 aspect-square w-full max-w-xs overflow-hidden rounded-xl bg-zinc-950">
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
                    Camera unavailable. Use the &quot;Upload photo&quot; tab above.
                  </div>
                )}
                <CornerBrackets />
                {activeStep.exampleImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activeStep.exampleImage}
                    alt={`Example: ${activeStep.title}`}
                    className="absolute top-2 right-2 h-14 w-14 rounded-md border-2 border-white/80 object-cover shadow-md"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}
              </div>

              {currentPhoto ? (
                <button
                  onClick={handleRetake}
                  aria-label="Retake photo"
                  className="mt-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-ink transition-opacity hover:opacity-90"
                >
                  <RotateCcw className="h-6 w-6" strokeWidth={2.25} />
                </button>
              ) : (
                <button
                  onClick={handleCapture}
                  disabled={cameraStatus !== "ready"}
                  aria-label="Capture photo"
                  className="mt-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  <span className="h-11 w-11 rounded-full border-2 border-accent-ink" />
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => uploadInputRef.current?.click()}
              disabled={isUploading}
              className="mt-4 flex w-full max-w-xs flex-col items-center gap-2 rounded-xl border border-dashed border-border-subtle px-4 py-8 text-center transition-colors hover:border-accent disabled:opacity-50"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-page text-ink-muted">
                <Upload className="h-5 w-5" strokeWidth={2.25} />
              </span>
              <span className="text-sm font-medium text-ink-primary">
                {isUploading ? "Processing…" : "Upload a photo instead"}
              </span>
              <span className="text-xs text-ink-muted">JPG, PNG up to 10MB</span>
            </button>
          )}

          {uploadError && (
            <p className="mt-3 text-sm text-status-critical-text">
              {uploadError}
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-center gap-2">
          {CAPTURE_STEPS.map((step, i) => (
            <button
              key={step.id}
              onClick={() => goToStep(i)}
              className={`h-14 w-14 overflow-hidden rounded-lg border-2 ${
                i === activeIndex ? "border-accent" : "border-transparent"
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
                <div className="flex h-full w-full items-center justify-center bg-border-subtle text-xs text-ink-muted">
                  {i + 1}
                </div>
              )}
            </button>
          ))}
        </div>

        {allCaptured && (
          <button
            onClick={handleContinue}
            className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-full bg-accent px-8 text-base font-medium text-accent-ink transition-opacity hover:opacity-90"
          >
            Continue to report
          </button>
        )}
      </main>
    </div>
  );
}
