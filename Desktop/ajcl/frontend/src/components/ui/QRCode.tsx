
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { cn } from "@/lib/utils";

/** Renders `value` as a scannable QR code (SVG). Falls back to nothing if generation fails —
 *  the 6-digit code printed alongside it always works as a backup. */
export function QRCodeDisplay({
  value,
  size = 176,
  className,
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  const [svg, setSvg] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    QRCode.toString(value, { type: "svg", margin: 1, width: size, color: { dark: "#141414", light: "#ffffff" } })
      .then((markup) => {
        if (mounted.current) setSvg(markup);
      })
      .catch(() => {
        if (mounted.current) setSvg(null);
      });
    return () => {
      mounted.current = false;
    };
  }, [value, size]);

  if (!svg) {
    return (
      <div
        className={cn("grid place-items-center rounded-sm bg-surface-2 text-xs text-muted", className)}
        style={{ width: size, height: size }}
      >
        Loading QR…
      </div>
    );
  }

  return (
    <div
      className={cn("overflow-hidden rounded-2xl border border-line bg-paper shadow-card p-2", className)}
      style={{ width: size + 16, height: size + 16 }}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
