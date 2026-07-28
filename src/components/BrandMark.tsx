"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Settings = {
  companyName: string;
  logoPath: string;
  tagline?: string;
};

export function BrandMark({
  size = 64,
  showName = false,
  href = "/",
}: {
  size?: number;
  showName?: boolean;
  href?: string;
}) {
  const [settings, setSettings] = useState<Settings>({
    companyName: "Laboratorio Art-Dental",
    logoPath: "/logo-art-dental.jpg",
    tagline: "Devolvemos sonrisas",
  });

  useEffect(() => {
    fetch("/api/settings")
      .then(async (r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((data) => {
        if (data?.companyName && data?.logoPath) setSettings(data);
      })
      .catch(() => undefined);
  }, []);

  // Logo horizontal Art-Dental (~1.3:1). size = altura, como el ícono cuadrado anterior.
  const height = size;
  const width = Math.round(size * 1.35);

  return (
    <Link href={href} className="inline-flex items-center gap-3">
      <Image
        src={settings.logoPath}
        alt={settings.companyName}
        width={width}
        height={height}
        className="brand-logo rounded-xl object-contain bg-white"
        style={{ width, height, maxWidth: "100%" }}
        unoptimized
        priority
      />
      {showName && (
        <span className="leading-tight">
          <span
            className="display font-semibold tracking-tight block"
            style={{
              fontSize: size > 56 ? "1.45rem" : "1.1rem",
              color: "var(--brand-dark)",
            }}
          >
            {settings.companyName}
          </span>
          {settings.tagline && (
            <span className="block text-xs text-[var(--muted)]">
              {settings.tagline}
            </span>
          )}
        </span>
      )}
    </Link>
  );
}
