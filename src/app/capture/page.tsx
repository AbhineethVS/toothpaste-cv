"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  Camera,
  Check,
  ImagePlus,
  Info,
  RotateCcw,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { CAPTURE_STEPS, type CaptureStepId } from "@/lib/capture-steps";
import { captureVideoFrame, compressImage } from "@/lib/compress-image";

type CameraStatus = "starting" | "ready" | "error";
type CaptureMode = "camera" | "upload";

const TEETH_NOT_VISIBLE_MESSAGE =
  "We couldn't clearly see your teeth in this photo. Open your mouth or smile wider, keep teeth centered, and try again in brighter light.";

const CAPTURE_GUIDES: Record<CaptureStepId, string[]> = {
  "front-bite": ["Bite gently with teeth together", "Show the full smile from left to right", "Keep lips away from the front teeth"],
  "upper-arch": ["Tilt your head back", "Open wide and aim at the upper teeth", "Use a mirror or helper if needed"],
  "lower-arch": ["Tilt your chin down", "Open wide and show the lower teeth", "Keep the tongue below the teeth"],
  "left-buccal": ["Turn slightly to show the left bite", "Keep teeth together", "Pull the cheek aside if needed"],
  "right-buccal": ["Turn slightly to show the right bite", "Keep teeth together", "Pull the cheek aside if needed"],
};

function loadDataUrlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Photo could not be checked."));
    img.src = src;
  });
}

async function hasVisibleTeeth(dataUrl: string): Promise<boolean> {
  const img = await loadDataUrlImage(dataUrl);
  const canvas = document.createElement("canvas");
  const width = 180;
  const height = Math.max(120, Math.round((img.height / Math.max(img.width, 1)) * width));
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return true;
  ctx.drawImage(img, 0, 0, width, height);

  const cropX = Math.round(width * 0.16);
  const cropY = Math.round(height * 0.18);
  const cropWidth = Math.round(width * 0.68);
  const cropHeight = Math.round(height * 0.64);
  const { data } = ctx.getImageData(cropX, cropY, cropWidth, cropHeight);

  let toothLike = 0;
  let oralContext = 0;
  let brightnessSum = 0;
  let brightnessSquareSum = 0;
  const rowsWithTeeth = new Set<number>();
  const columnsWithTeeth = new Set<number>();
  const total = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    const pixel = i / 4;
    const x = pixel % cropWidth;
    const y = Math.floor(pixel / cropWidth);
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const brightness = (r + g + b) / 3;
    const saturation = max === 0 ? 0 : (max - min) / max;
    const balanced = Math.abs(r - g) < 48 && Math.abs(g - b) < 58 && Math.abs(r - b) < 68;
    const toothPixel = brightness > 145 && saturation < 0.34 && balanced;
    const gumOrLipPixel = r > 92 && r > g * 1.08 && r > b * 1.08 && saturation > 0.16;
    const mouthShadowPixel = brightness < 92 && saturation < 0.72;

    brightnessSum += brightness;
    brightnessSquareSum += brightness * brightness;

    if (gumOrLipPixel || mouthShadowPixel) oralContext += 1;

    if (toothPixel) {
      toothLike += 1;
      rowsWithTeeth.add(y);
      columnsWithTeeth.add(x);
    }
  }

  const toothRatio = toothLike / total;
  const oralContextRatio = oralContext / total;
  const meanBrightness = brightnessSum / total;
  const brightnessVariance = brightnessSquareSum / total - meanBrightness * meanBrightness;
  const brightnessStdDev = Math.sqrt(Math.max(0, brightnessVariance));
  const toothRowCoverage = rowsWithTeeth.size / cropHeight;
  const toothColumnCoverage = columnsWithTeeth.size / cropWidth;

  const hasToothArea = toothRatio > 0.018 && toothRatio < 0.45;
  const hasToothShape = toothRowCoverage > 0.055 && toothColumnCoverage > 0.12;
  const hasPhotoVariation = brightnessStdDev > 20;
  const hasMouthContext = oralContextRatio > 0.018;
  const hasStrongToothPattern = toothRatio > 0.075 && hasToothShape && brightnessStdDev > 28;

  return hasToothArea && hasToothShape && hasPhotoVariation && (hasMouthContext || hasStrongToothPattern);
}

function CornerBrackets() {
  const corners = [
    "top-4 left-4 border-t-2 border-l-2 rounded-tl-lg",
    "top-4 right-4 border-t-2 border-r-2 rounded-tr-lg",
    "bottom-4 left-4 border-b-2 border-l-2 rounded-bl-lg",
    "bottom-4 right-4 border-b-2 border-r-2 rounded-br-lg",
  ];
  return (
    <>
      {corners.map((classes) => (
        <div
          key={classes}
          aria-hidden
          className={`pointer-events-none absolute h-10 w-10 border-white/85 ${classes}`}
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
    { id: "camera", label: "Camera", icon: Camera },
    { id: "upload", label: "Upload", icon: Upload },
  ];
  return (
    <div className="grid grid-cols-2 gap-1 rounded-full bg-surface-page p-1">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex h-10 items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors ${
            mode === id
              ? "bg-accent text-accent-ink shadow-[0_8px_20px_rgba(35,95,100,0.16)]"
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

function statusText(status: CameraStatus, hasPhoto: boolean) {
  if (hasPhoto) return "Photo captured";
  if (status === "ready") return "Camera ready";
  if (status === "starting") return "Starting camera";
  return "Upload available";
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
  const [isCheckingPhoto, setIsCheckingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const activeStep = CAPTURE_STEPS[activeIndex];
  const currentPhoto = photos[activeIndex];
  const completedCount = photos.filter(Boolean).length;
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
    setCaptureError(null);
    setUploadError(null);
  }

  async function storePhoto(dataUrl: string) {
    setIsCheckingPhoto(true);
    setCaptureError(null);
    setUploadError(null);
    try {
      if (!(await hasVisibleTeeth(dataUrl))) {
        setCaptureError(TEETH_NOT_VISIBLE_MESSAGE);
        return;
      }
    } catch {
      setCaptureError("We couldn't check that photo. Please retake it with your teeth clearly visible.");
      return;
    } finally {
      setIsCheckingPhoto(false);
    }

    setPhotos((prev) => {
      const next = [...prev];
      next[activeIndex] = dataUrl;
      return next;
    });
    setActiveIndex((prev) => Math.min(prev + 1, CAPTURE_STEPS.length - 1));
  }

  async function handleCapture() {
    if (!videoRef.current) return;
    await storePhoto(captureVideoFrame(videoRef.current));
  }

  function handleRetake() {
    setCaptureError(null);
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
    setCaptureError(null);
    try {
      await storePhoto(await compressImage(file));
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
    <div className="theme-capture flex min-h-screen w-full min-w-0 flex-col bg-surface-page text-ink-primary">
      <header className="w-full border-b border-border-subtle bg-surface-page/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-ink-secondary transition-colors hover:text-ink-primary"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
            Back
          </Link>
          <div className="min-w-0 text-center">
            <p className="truncate text-sm font-semibold text-ink-primary">Capture photos</p>
            <p className="text-xs text-ink-muted">
              {completedCount} of {CAPTURE_STEPS.length} complete
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-border-subtle bg-surface-card px-3 py-1.5 text-xs font-medium text-ink-secondary">
            Step {activeIndex + 1}
          </span>
        </div>
      </header>

      <main className="mx-auto grid w-full min-w-0 max-w-6xl flex-1 gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:py-8">
        <section className="rounded-[28px] border border-border-subtle bg-surface-card p-4 shadow-[0_18px_50px_rgba(42,54,71,0.08)] sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">
                {isCheckingPhoto ? "Checking photo" : statusText(cameraStatus, Boolean(currentPhoto))}
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink-primary">
                {activeStep.title}
              </h1>
              <p className="mt-1 max-w-xl text-sm leading-6 text-ink-secondary">
                {activeStep.instruction}
              </p>
            </div>
            <div className="w-full sm:w-56">
              <ModeTabs mode={mode} onChange={setMode} />
            </div>
          </div>

          <div className="mt-4 grid gap-2 rounded-2xl bg-surface-page/70 p-3 sm:grid-cols-3">
            {CAPTURE_GUIDES[activeStep.id].map((item) => (
              <div key={item} className="flex items-start gap-2 text-xs leading-5 text-ink-secondary">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-good-text" strokeWidth={2.4} />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <input
            ref={uploadInputRef}
            type="file"
            accept="image/*"
            onChange={handleUploadChange}
            className="hidden"
          />

          {mode === "camera" ? (
            <div className="mt-5">
              <div className="relative mx-auto aspect-[4/3] w-full max-w-3xl overflow-hidden rounded-[24px] bg-zinc-950 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
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
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/85 text-sm text-zinc-200">
                    Starting camera...
                  </div>
                )}
                {!currentPhoto && isCheckingPhoto && (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/75 text-sm font-medium text-zinc-100 backdrop-blur-sm">
                    Checking teeth visibility...
                  </div>
                )}
                {!currentPhoto && cameraStatus === "error" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/85 px-6 text-center text-sm text-zinc-200">
                    <Upload className="mb-3 h-6 w-6" strokeWidth={2.25} />
                    Camera unavailable. Upload a photo instead.
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_42%,rgba(0,0,0,0.34)_100%)]" />
                <CornerBrackets />
                <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                    Keep teeth centered
                  </span>
                  <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-zinc-900 backdrop-blur-md">
                    {activeIndex + 1} / {CAPTURE_STEPS.length}
                  </span>
                </div>
                {activeStep.exampleImage && (
                  <div className="absolute bottom-4 right-4 overflow-hidden rounded-2xl border border-white/70 bg-white/90 p-1 shadow-[0_10px_24px_rgba(0,0,0,0.22)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeStep.exampleImage}
                      alt={`Example: ${activeStep.title}`}
                      className="h-20 w-20 rounded-xl object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-center justify-center gap-4">
                {currentPhoto && (
                  <button
                    onClick={handleRetake}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border-subtle bg-surface-page px-5 text-sm font-medium text-ink-secondary transition-colors hover:text-ink-primary"
                  >
                    <RotateCcw className="h-4 w-4" strokeWidth={2.25} />
                    Retake
                  </button>
                )}
                {!currentPhoto && (
                  <button
                    onClick={handleCapture}
                    disabled={cameraStatus !== "ready" || isCheckingPhoto}
                    aria-label="Capture photo"
                    className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-accent-ink shadow-[0_14px_30px_rgba(35,95,100,0.24)] transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    <span className="h-14 w-14 rounded-full border-2 border-accent-ink" />
                  </button>
                )}
                {currentPhoto && (
                  <button
                    onClick={() => setActiveIndex((index) => Math.min(index + 1, CAPTURE_STEPS.length - 1))}
                    disabled={activeIndex === CAPTURE_STEPS.length - 1}
                    className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-5 text-sm font-medium text-accent-ink transition-opacity hover:opacity-90 disabled:opacity-45"
                  >
                    Next view
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-5 flex min-h-[420px] items-center justify-center rounded-[24px] border border-dashed border-border-subtle bg-surface-page/70 p-6 text-center">
              <button
                onClick={() => uploadInputRef.current?.click()}
                disabled={isUploading || isCheckingPhoto}
                className="flex w-full max-w-sm flex-col items-center gap-3 rounded-[24px] bg-surface-card px-6 py-10 shadow-[0_14px_36px_rgba(42,54,71,0.08)] transition-transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-page text-accent">
                  <ImagePlus className="h-6 w-6" strokeWidth={2.25} />
                </span>
                <span className="text-base font-semibold text-ink-primary">
                  {isUploading || isCheckingPhoto ? "Checking photo..." : "Upload this view"}
                </span>
                <span className="text-sm leading-6 text-ink-muted">
                  Use a clear JPG or PNG with the same angle shown in the reference.
                </span>
              </button>
            </div>
          )}

          {captureError && (
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-status-critical/20 bg-status-critical/10 px-3 py-3 text-sm text-status-critical-text">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.25} />
              <p className="leading-5">{captureError}</p>
            </div>
          )}

          {uploadError && (
            <p className="mt-4 rounded-xl bg-status-critical/10 px-3 py-2 text-sm text-status-critical-text">
              {uploadError}
            </p>
          )}

          {allCaptured && (
            <button
              onClick={handleContinue}
              className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-accent px-8 text-base font-medium text-accent-ink shadow-[0_12px_28px_rgba(35,95,100,0.18)] transition-opacity hover:opacity-90"
            >
              Continue to report
            </button>
          )}
        </section>

        <aside className="flex flex-col gap-4">
          <section className="rounded-[24px] border border-border-subtle bg-surface-card p-5 shadow-[0_18px_50px_rgba(42,54,71,0.08)]">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-status-good/12 text-status-good-text">
                <ShieldCheck className="h-5 w-5" strokeWidth={2.25} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-ink-primary">Before you capture</h2>
                <p className="mt-1 text-sm leading-6 text-ink-secondary">
                  Use bright, even light and keep the camera steady. Retake any blurry view.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[24px] border border-border-subtle bg-surface-card p-5 shadow-[0_18px_50px_rgba(42,54,71,0.08)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink-primary">Photo set</h2>
              <span className="text-xs font-medium text-ink-muted">
                {completedCount}/{CAPTURE_STEPS.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {CAPTURE_STEPS.map((step, i) => {
                const isActive = i === activeIndex;
                const isComplete = Boolean(photos[i]);
                return (
                  <button
                    key={step.id}
                    onClick={() => goToStep(i)}
                    className={`flex items-center gap-3 rounded-2xl border px-3 py-2 text-left transition-colors ${
                      isActive
                        ? "border-accent bg-accent/8"
                        : "border-transparent bg-surface-page hover:border-border-subtle"
                    }`}
                    aria-label={`Review ${step.title}`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl ${
                        isComplete ? "bg-status-good/12" : "bg-surface-card"
                      }`}
                    >
                      {photos[i] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photos[i]!} alt="" className="h-full w-full object-cover" />
                      ) : isComplete ? (
                        <Check className="h-4 w-4 text-status-good-text" strokeWidth={2.5} />
                      ) : (
                        <span className="text-xs font-semibold text-ink-muted">{i + 1}</span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink-primary">
                        {step.title}
                      </span>
                      <span className="block truncate text-xs text-ink-muted">
                        {isComplete ? "Captured" : "Needed"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-[24px] border border-border-subtle bg-surface-card p-5 shadow-[0_18px_50px_rgba(42,54,71,0.08)]">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2.25} />
              <p className="text-xs leading-5 text-ink-secondary">
                Photos stay in this browser session for the report flow. The screening is visual
                guidance only, not a dental diagnosis.
              </p>
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}
