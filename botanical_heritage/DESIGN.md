# Design System Document: High-End Editorial

## 1. Overview & Creative North Star: "The Botanical Atelier"
This design system is built to move away from the "generic e-commerce" aesthetic and toward a high-end editorial experience. Our Creative North Star is **The Botanical Atelier**. Imagine a curated gallery or a premium boutique apothecary: it is spacious, tactile, and intentionally quiet.

We break the "template" look by prioritizing **intentional asymmetry** and **tonal depth**. Instead of centering everything, we use white space as an active design element. We overlap images with typography and use dramatic shifts in type scale to guide the eye, creating a digital experience that feels as curated as a physical luxury product.

## 2. Color & Tonal Architecture
The palette is a sophisticated blend of botanical vitality (`primary: #384527`) and sun-drenched neutrals (`background: #fcf9f4`). 

### The "No-Line" Rule
**Explicit Instruction:** You are prohibited from using 1px solid borders for sectioning or containment. Structural boundaries must be defined solely through background color shifts.
*   *Implementation:* A product description section using `surface-container-low` (#f6f3ee) should sit directly against the `surface` (#fcf9f4) background. The change in tone is the boundary.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of fine, heavy-weight paper.
*   **Layer 0 (Base):** `surface` (#fcf9f4) for the main page body.
*   **Layer 1 (Grouping):** `surface-container` (#f0ede8) for large content blocks.
*   **Layer 2 (Emphasis):** `surface-container-highest` (#e5e2dd) for interactive elements or featured callouts.
*   **Layer 3 (Floating/Active):** `surface-container-lowest` (#ffffff) for cards that need to "pop" with maximum contrast against a tinted background.

### The "Glass & Gold" Rule
To elevate the "Luxurious" brand pillar:
*   **Gold Accents:** Use `secondary` (#745b1c) sparingly. It is a signature, not a primary filler. Reserve it for small UI details like icons, active states, or premium labels.
*   **Glassmorphism:** For navigation bars or floating modals, use a semi-transparent version of `surface` with a 20px-30px `backdrop-blur`. This allows the organic colors of product photography to bleed through, softening the interface.

## 3. Typography: Editorial Authority
The contrast between the heritage-rich **Noto Serif** and the modern, architectural **Manrope** creates an "Established yet Contemporary" feel.

*   **Display (Noto Serif):** Use `display-lg` (3.5rem) with tight letter-spacing (-0.02em) for hero headlines. This is your "voice."
*   **Headlines (Noto Serif):** Use `headline-md` (1.75rem) for section titles. Ensure generous top margins to give the "Editorial" breathing room.
*   **Body (Manrope):** Use `body-lg` (1rem) for product descriptions. Manrope’s geometric clarity ensures legibility even on small screens, balancing the serif’s decorative nature.
*   **Labels (Manrope):** Use `label-md` (0.75rem) in All-Caps with +0.05em tracking for eyebrow headers or category tags.

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are often too "digital." We use **Ambient Light** and **Tonal Stacking**.

*   **The Layering Principle:** To create a card, place a `surface-container-lowest` (#ffffff) element on a `surface-container` (#f0ede8) background. The contrast provides a natural "lift" without a single pixel of shadow.
*   **Ambient Shadows:** If a shadow is required for a floating CTA, use: `box-shadow: 0 12px 40px rgba(56, 69, 39, 0.06);`. Note the use of a tinted shadow (using the `primary` green) rather than grey; this mimics how light filters through organic matter.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility (e.g., input fields), use `outline-variant` (#c6c8bc) at 30% opacity. Never use a 100% opaque border.

## 5. Components

### Buttons
*   **Primary:** Background: `primary` (#384527), Text: `on-primary` (#ffffff). Shape: `md` (0.375rem).
*   **Secondary:** Background: `secondary-container` (#ffdc90), Text: `on-secondary-container` (#785f20). 
*   **Tertiary (The "Editorial" Link):** No background. Text: `primary`. Add a 1px underline using a subtle `primary` gradient that fades out.

### Input Fields
*   **Styling:** No solid box. Use a `surface-container-low` background with a `sm` (0.125rem) radius. 
*   **Interaction:** On focus, the background transitions to `surface-container-highest`. Use `primary` for the cursor/caret color.

### Cards & Lists
*   **Constraint:** Zero dividers. 
*   **Separation:** Use the `spacing-xl` (2rem) scale to create "islands" of content. 
*   **Signature Element:** Inhabit the "Asymmetry" rule—place product images slightly off-center within the card container to create visual tension.

### Signature Component: The Botanical Toast
A notification component using a `backdrop-blur` glass effect with a `primary` (#384527) left-accent bar. It should feel like a premium parchment tag attached to the UI.

## 6. Do’s and Don’ts

### Do:
*   **Use Generous Margins:** Content should "float" in the center of the viewport with significant lateral padding (e.g., 10% on desktop).
*   **Layering over Shadowing:** Always try to define an element by changing the background color of the container behind it first.
*   **Tone-on-Tone:** Use `on-surface-variant` (#45483f) for secondary text to maintain a soft, low-contrast sophisticated look.

### Don’t:
*   **Don't use pure black:** `#000000` is forbidden. Use `on-background` (#1c1c19) for the darkest elements.
*   **Don't use "Full" Roundedness:** Avoid `full` (pill-shaped) buttons for primary actions; stay within the `md` to `lg` range (0.375rem - 0.5rem) to maintain a sense of architectural structure.
*   **Don't use standard Dividers:** If you feel the need for a line, use a wide gutter of empty space instead. If space is limited, use a 1px tall rectangle with a soft gradient from `surface-variant` to `surface`.