"use client";
import { useState } from "react";
import { Icon } from "./Icon";
import { ProductImage } from "./ProductImage";

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [i, setI] = useState(0);
  const n = images.length;
  const go = (d: number) => setI((x) => (x + d + n) % n);
  return (
    <div className="gallery panel">
      <div
        className="gallery__main"
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") go(-1);
          if (e.key === "ArrowRight") go(1);
        }}
      >
        <ProductImage key={images[i]} src={images[i]} alt={n > 1 ? `${alt} — фото ${i + 1} з ${n}` : alt} eager />
        {n > 1 && (
          <>
            <button type="button" className="gallery__nav gallery__nav--prev" aria-label="Попереднє фото" onClick={() => go(-1)}>
              <Icon name="chevronLeft" />
            </button>
            <button type="button" className="gallery__nav gallery__nav--next" aria-label="Наступне фото" onClick={() => go(1)}>
              <Icon name="chevronRight" />
            </button>
          </>
        )}
      </div>
      {n > 1 && (
        <div className="gallery__thumbs">
          {images.map((src, k) => (
            <button key={src} type="button" className="gallery__thumb" aria-current={k === i} aria-label={`Фото ${k + 1}`} onClick={() => setI(k)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
