import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  canStreamCamera,
  frameToFile,
  normalizePhoto,
  prefersNativeCamera,
} from "@/lib/image-capture";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  es: boolean;
  disabled?: boolean;
}

/** Live camera preview for desktop browsers (webcam) and for phones without a native picker. */
function CameraDialog({
  open,
  onClose,
  onCapture,
  es,
}: {
  open: boolean;
  onClose: () => void;
  onCapture: (f: File) => void;
  es: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [facing, setFacing] = useState<"environment" | "user">("environment");

  useEffect(() => {
    if (!open) return;
    let stream: MediaStream | null = null;
    let cancelled = false;
    setReady(false);
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: { ideal: facing }, width: { ideal: 1920 } },
        audio: false,
      })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => {
        toast.error(
          es
            ? "No se pudo abrir la cámara. Revisa el permiso del navegador."
            : "Could not open the camera. Check the browser permission.",
        );
        onClose();
      });
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [open, facing, es, onClose]);

  async function shoot() {
    if (!videoRef.current) return;
    onCapture(await frameToFile(videoRef.current));
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogTitle>{es ? "Foto de la factura" : "Invoice photo"}</DialogTitle>
        <DialogDescription>
          {es
            ? "Encuadra la factura completa, con buena luz y sin reflejos."
            : "Frame the whole invoice, in good light and without glare."}
        </DialogDescription>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onLoadedData={() => setReady(true)}
          className="aspect-[4/3] w-full border-2 border-rule bg-foreground object-cover"
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={shoot} disabled={!ready}>
            <Camera />
            {es ? "Tomar foto" : "Take photo"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
          >
            <RefreshCw />
            {es ? "Cambiar cámara" : "Switch camera"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * "Take photo" button. On phones it opens the native camera through a file input
 * (works over plain HTTP too); on desktop it streams the webcam into a dialog.
 */
export function CameraCapture({ onCapture, es, disabled }: CameraCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const closeDialog = useCallback(() => setDialogOpen(false), []);

  function open() {
    if (prefersNativeCamera() || !canStreamCamera()) inputRef.current?.click();
    else setDialogOpen(true);
  }

  async function fromInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onCapture(await normalizePhoto(file));
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={open} disabled={disabled}>
        <Camera />
        {es ? "Tomar foto" : "Take photo"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={fromInput}
      />
      <CameraDialog open={dialogOpen} onClose={closeDialog} onCapture={onCapture} es={es} />
    </>
  );
}
