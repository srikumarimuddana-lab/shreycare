# Design System Document: Rich Premium Editorial

## 1. Overview & Creative North Star: "The Botanical Atelier"
This design system moves away from the "generic e-commerce" aesthetic toward a high-end editorial experience. Our Creative North Star is **The Botanical Atelier**. Imagine a curated gallery or a premium boutique apothecary: it is spacious, tactile, and intentionally quiet.

We break the "template" look by prioritizing **intentional asymmetry** and **tonal depth**. Instead of centering everything, we use white space as an active design element. We overlap images with typography and use dramatic shifts in type scale to guide the eye, creating a digital experience that feels as curated as a physical luxury product.

## 2. Color & Tonal Architecture
The palette pairs a deep, sophisticated forest green (`primary: #24382C`) with a warm parchment/cream neutral (`background: #EFE8D8`) and a muted antique-gold accent (`secondary: #B08D57`). It's built directly around the brand mark (the green leaf/droplet logo on cream).

### Hairline Borders
Cards and sections are now defined with a **1px hairline border** in `outline-variant` (`#DDD3BA`) rather than pure background-shift boundaries. Pair every hairline border with a soft, tinted hover-lift shadow (`shadow-botanical`) rather than a hard drop shadow — the border gives definition at rest, the shadow gives it life on interaction.
*   *Implementation:* a card uses `surface-container-lowest` (`#F4EFE4`) with a `1px solid outline-variant` border and `rounded-lg`; on hover it lifts (`-translate-y-1 to -translate-y-1.5`) and gains `shadow-botanical`/`shadow-botanical-lg`.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers — like stacked sheets of fine, heavy-weight paper.
*   **Layer 0 (Base):** `surface` (`#EFE8D8`) for the main page body.
*   **Layer 1 (Grouping):** `surface-container` (`#EAE2D0`) for large content blocks, trust strips, testimonial bands.
*   **Layer 2 (Emphasis):** `surface-container-high`/`surface-container-highest` (`#E7EADF` / `#E6DEC8`) for icon chips, hover fills, interactive callouts.
*   **Layer 3 (Floating/Active):** `surface-container-lowest` (`#F4EFE4`) for cards that need to "pop" — product cards, benefit cards, review-style panels.
*   **Inverse (Editorial contrast):** `inverse-surface` (`#1C2C22`, near-black forest green) for the Philosophy panel, Testimonial-on-dark moments, footer, and the newsletter CTA block — used sparingly to punctuate the mostly-light page with a few deliberate dark beats.

### The "Glass & Gold" Rule
To elevate the "Luxurious" brand pillar:
*   **Gold Accents:** Use `secondary` (`#B08D57`) and `secondary-container` (`#C7A86A`, brighter, for CTAs on dark backgrounds) sparingly. It is a signature, not a primary filler — eyebrow labels, star ratings, prices, dividers, hover-state buttons on dark sections.
*   **Glassmorphism:** The sticky navigation uses a semi-transparent `surface` (~86% opacity) with a `12px` `backdrop-blur` (see `.glass-nav` in `globals.css`) plus a hairline `outline-variant` bottom border, so product photography and page content can bleed through subtly as the user scrolls.

## 3. Typography: Editorial Authority
The contrast between the heritage-rich **Cormorant Garamond** (serif, with italic for emphasis words) and the modern, architectural **Manrope** creates an "Established yet Contemporary" feel.

*   **Display (Cormorant Garamond):** Large, tight-leading hero headlines (5xl–7xl), often with a single **italic** accent word/phrase in the gold-tinted ink for emphasis.
*   **Headlines (Cormorant Garamond):** `text-4xl`–`text-5xl` for section titles. Ensure generous top margins to give the "Editorial" breathing room.
*   **Body (Manrope):** `text-base`–`text-lg` for product descriptions and paragraph copy. Manrope's geometric clarity ensures legibility even on small screens, balancing the serif's decorative nature.
*   **Labels (Manrope):** `text-xs`/`text-sm` in All-Caps with `+0.14em` tracking for eyebrow headers, category tags, and footer column headings.

## 4. Elevation & Depth
Traditional flat drop shadows are too "digital." We use **ambient, tinted shadows** plus **hover-lift** motion.

*   **The Layering Principle:** To create a card, place `surface-container-lowest` (`#F4EFE4`) on a lighter/darker neighboring surface, add a 1px `outline-variant` hairline, and let the tinted shadow do the rest on hover.
*   **Ambient Shadows:** `box-shadow: 0 12px 40px rgba(36, 56, 44, 0.08)` at rest (`shadow-botanical`); `0 30px 60px -20px rgba(36, 56, 44, 0.35)` on hover/floating elements (`shadow-botanical-lg`). Always a tinted forest-green shadow, never grey.
*   **Motion:** Cards and buttons lift 4–6px and gain shadow on hover (`transition-all duration-300/500`); this replaces static elevation as the primary "interactive" signal.

## 5. Components

### Buttons
*   **Primary:** Background `primary` (`#24382C`), text `on-primary` (`#F4EFE4`). Radius `md` (`0.75rem`).
*   **Secondary (on dark):** Background `secondary-container` (`#C7A86A`), text `on-secondary-container` (`#24382C`).
*   **Tertiary (The "Editorial" Link):** No background. Text `primary`, 1px underline in `primary/20` that solidifies to `primary` on hover.
*   Radii now run `sm` (`0.5rem`) → `xl` (`1.5rem`) — fuller rounding is welcome for pill-style chips, tags, and icon-circle buttons; primary CTAs stay in the `md`–`lg` range.

### Input Fields
*   **Styling:** No solid box. `surface-container-low` background with `sm` radius.
*   **Interaction:** On focus, background transitions to `surface-container-highest`. `primary` for the cursor/caret color.

### Cards & Lists
*   **Hairline + Lift:** Every card gets a 1px `outline-variant` border and `rounded-lg`; hover state lifts the card and adds `shadow-botanical`/`shadow-botanical-lg`.
*   **Separation:** Use the `spacing-xl`/`2xl` scale between cards/sections; avoid dense stacking.
*   **Signature Element:** Product/benefit imagery can sit slightly off-center or overlap section boundaries to create visual tension (asymmetric collages, floating quote cards).

### Signature Component: The Botanical Toast
A notification component using a `backdrop-blur` glass effect with a `primary` (`#24382C`) left-accent bar. It should feel like a premium parchment tag attached to the UI.

## 6. Do's and Don'ts

### Do:
*   **Use Generous Margins:** Content should "float" with significant lateral padding (e.g., 8–10% on desktop).
*   **Punctuate with Dark Sections:** Use the inverse forest-green treatment for 1–2 key moments per page (Philosophy panel, newsletter CTA, footer) — not everywhere.
*   **Tone-on-Tone:** Use `on-surface-variant` (`#54604F`) for secondary text to maintain a soft, low-contrast sophisticated look.

### Don't:
*   **Don't use pure black:** `#000000` is forbidden. Use `on-background` (`#2A2A26`) for the darkest text.
*   **Don't use heavy borders:** Hairlines only (1px, `outline-variant`) — never a bold or dark border.
*   **Don't invent numbers or quotes:** Star ratings, review counts, per-product FAQs, and customer testimonials must come from real data (Sanity content). Never hardcode placeholder review content that reads as genuine.
