"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Settings = {
  companyName: string;
  logoPath: string;
};

export function BrandMark({
  size = 40,
  showName = true,
  href = "/",
}: {
  size?: number;
  showName?: boolean;
  href?: string;
}) {
  const [settings, setSettings] = useState<Settings>({
    companyName: "ArcadaLab",
    logoPath: "/logo.svg",
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data?.companyName) setSettings(data);
      })
      .catch(() => undefined);
  }, []);

  return (
    <Link href={href} className="inline-flex items-center gap-3">
      <Image
        src={settings.logoPath}
        alt={settings.companyName}
        width={size}
        height={size}
        className="rounded-xl"
        unoptimized
        priority
      />
      {showName && (
        <span
          className="display font-semibold tracking-tight"
          style={{ fontSize: size > 42 ? "1.55rem" : "1.15rem", color: "var(--brand-dark)" }}
        >
          {settings.companyName}
        </span>
      )}
    </Link>
  );
}
