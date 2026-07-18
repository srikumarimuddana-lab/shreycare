"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

export interface ProductOption {
  name: string;
  price: number;
  inStock?: boolean;
}

// Loads the store's products (name + price) once for use as combobox options.
// Sourced from Sanity so selecting one fills both the exact product name
// (which the stock auto-decrement matches on) and the current sale price.
export function useAdminProducts(): ProductOption[] {
  const [products, setProducts] = useState<ProductOption[]>([]);
  useEffect(() => {
    let active = true;
    fetch("/api/admin/inventory/sanity-products")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: unknown) => {
        if (!active) return;
        const opts = (Array.isArray(data) ? data : [])
          .map((p) => ({
            name: String((p as { name?: string }).name ?? "").trim(),
            price: Number((p as { price?: number }).price) || 0,
            inStock: (p as { inStock?: boolean }).inStock,
          }))
          .filter((p) => p.name);
        setProducts(opts);
      })
      .catch(() => {
        /* products just stay empty — the combobox still allows free typing */
      });
    return () => {
      active = false;
    };
  }, []);
  return products;
}

// A product picker that is simultaneously a free-text input, a searchable
// dropdown, and a select: type to filter the store's products, click/Enter to
// choose one (fills name + price), or just type any custom name that isn't in
// the list.
export function ProductCombobox({
  value,
  products,
  onChange,
  onSelect,
  disabled,
  required,
  className,
  containerClassName,
  placeholder,
}: {
  value: string;
  products: ProductOption[];
  onChange: (name: string) => void;
  onSelect?: (product: ProductOption) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  containerClassName?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    const list = q
      ? products.filter((p) => p.name.toLowerCase().includes(q))
      : products;
    return list.slice(0, 8);
  }, [products, value]);

  // Close when clicking outside the widget.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function choose(p: ProductOption) {
    onChange(p.name);
    onSelect?.(p);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown") setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      // Only intercept Enter when a product is highlighted, so typing a custom
      // name and pressing Enter doesn't get hijacked.
      if (filtered[highlight]) {
        e.preventDefault();
        choose(filtered[highlight]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className={`relative ${containerClassName ?? ""}`}>
      <input
        type="text"
        value={value}
        disabled={disabled}
        required={required}
        placeholder={placeholder ?? "Search or type a product…"}
        className={className}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {open && filtered.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-auto rounded-lg border border-outline-variant bg-surface-container-lowest shadow-botanical-lg text-sm"
        >
          {filtered.map((p, i) => (
            <li key={p.name} role="option" aria-selected={i === highlight}>
              <button
                type="button"
                // Fire before the input blurs so the selection isn't lost.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(p)}
                onMouseEnter={() => setHighlight(i)}
                className={`w-full text-left px-3 py-2 flex items-center justify-between gap-3 transition-colors ${
                  i === highlight ? "bg-primary/10" : "hover:bg-surface-container-low"
                }`}
              >
                <span className="truncate text-on-surface">
                  {p.name}
                  {p.inStock === false && (
                    <span className="ml-2 text-[10px] text-error font-semibold">out of stock</span>
                  )}
                </span>
                <span className="text-on-surface-variant whitespace-nowrap">${p.price.toFixed(2)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
