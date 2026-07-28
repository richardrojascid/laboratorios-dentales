"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCLP } from "@/lib/format";

export type PriceItem = {
  id: string;
  code: string;
  name: string;
  category: string;
  priceNeto: number;
  priceIva: number | null;
  note: string | null;
};

export type SelectedLine = {
  code: string;
  name: string;
  price: number;
};

export function PriceItemPicker({
  value,
  onChange,
  useIva = false,
}: {
  value: SelectedLine[];
  onChange: (items: SelectedLine[], total: number) => void;
  useIva?: boolean;
}) {
  const [catalog, setCatalog] = useState<PriceItem[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/prices")
      .then((r) => r.json())
      .then((data) => setCatalog(Array.isArray(data) ? data : []))
      .catch(() => setCatalog([]));
  }, []);

  const selectedCodes = useMemo(
    () => new Set(value.map((v) => v.code)),
    [value]
  );

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = catalog.filter((item) => {
      if (!q) return true;
      return (
        item.code.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
    const map = new Map<string, PriceItem[]>();
    for (const item of filtered) {
      const list = map.get(item.category) || [];
      list.push(item);
      map.set(item.category, list);
    }
    return Array.from(map.entries());
  }, [catalog, query]);

  function toggle(item: PriceItem) {
    const price = useIva && item.priceIva != null ? item.priceIva : item.priceNeto;
    let next: SelectedLine[];
    if (selectedCodes.has(item.code)) {
      next = value.filter((v) => v.code !== item.code);
    } else {
      next = [...value, { code: item.code, name: item.name, price }];
    }
    const total = next.reduce((sum, line) => sum + line.price, 0);
    onChange(next, total);
  }

  const total = value.reduce((sum, line) => sum + line.price, 0);

  return (
    <div className="price-picker">
      <div className="mobile-stack row mb-3">
        <div>
          <label className="label">Catálogo de trabajos (código + nombre) *</label>
          <p className="text-xs text-[var(--muted)] m-0">
            Marca uno o varios ítems. El código queda visible en la solicitud.
          </p>
        </div>
        <input
          className="input"
          style={{ maxWidth: 240 }}
          placeholder="Buscar código o nombre..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="price-list">
        {grouped.length === 0 ? (
          <p className="empty">No hay ítems de precio cargados.</p>
        ) : (
          grouped.map(([category, items]) => (
            <div key={category} className="mb-4">
              <h4 className="text-sm uppercase tracking-wide text-[var(--brand)] m-0 mb-2">
                {category}
              </h4>
              <div className="space-y-2">
                {items.map((item) => {
                  const checked = selectedCodes.has(item.code);
                  const price =
                    useIva && item.priceIva != null
                      ? item.priceIva
                      : item.priceNeto;
                  return (
                    <label
                      key={item.id}
                      className={`price-row ${checked ? "selected" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(item)}
                      />
                      <span className="price-code">{item.code}</span>
                      <span className="price-name">
                        {item.name}
                        {item.note ? (
                          <span className="block text-xs text-[var(--muted)]">
                            {item.note}
                          </span>
                        ) : null}
                      </span>
                      <span className="price-amount">{formatCLP(price)}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="price-total">
        <strong>Total seleccionado:</strong> {formatCLP(total)}
        {value.length > 0 && (
          <span className="text-xs text-[var(--muted)] ml-2">
            ({value.length} ítem{value.length === 1 ? "" : "s"})
          </span>
        )}
      </div>
    </div>
  );
}
