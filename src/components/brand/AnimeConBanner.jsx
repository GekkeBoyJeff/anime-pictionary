/*
 * AnimeConBanner — compact 60px-tall header badge for the Hidden Spirits banner.
 *
 * The source art is a wide 2345×835 PNG; we constrain height and let
 * `object-fit: contain` show the logo lockup centred without cropping. The
 * banner serves as a lightweight convention "watermark" — it signals where
 * we are without dominating the page.
 *
 * If you later want a full-bleed hero variant, add a `variant` prop and swap
 * the container's height + object-fit to `cover`.
 */

import { cn } from "../../lib/cn.js";

// Native pixel dimensions — emitted into width/height attributes so the
// browser reserves the right aspect ratio before the image loads.
const NATIVE_W = 2345;
const NATIVE_H = 835;

export const AnimeConBanner = ({ className, height = 60 }) => {
    const src = `${import.meta.env.BASE_URL}brand/animecon-2026-banner.png`;

    return (
        <img
            src={src}
            alt="AnimeCon 2026 — Hidden Spirits"
            width={NATIVE_W}
            height={NATIVE_H}
            loading="lazy"
            decoding="async"
            className={cn("block object-contain", className)}
            style={{ height: `${height}px`, width: "auto" }}
        />
    );
};
