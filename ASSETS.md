# CASECLAN asset record

Generated with the built-in image-generation tool. Images depict conceptual products, not certified models, fit or materials.

## Hero

Project file: `public/images/hero.webp` (source: `source-assets/hero.png`).

Prompt: A wide 3:1 luxury fashion-tech campaign photograph. A young adult man with dark wavy hair, black sunglasses and a textured black jacket holds a triple-camera flagship smartphone in a black carbon-fiber CASECLAN case, back toward the viewer. Pale grey architectural wall at left for the editorial headline. Dark cinematic low-saturation photography, realistic texture, sharply focused hand and case. No interface or watermark; tiny CASECLAN lettering on the case only.

## Clan cases

Project files: `public/images/noir.webp`, `valor.webp`, `sage.webp`, `aura.webp`. Source contact sheet: `source-assets/clans.png`; optimized sheet: `public/images/clans.webp`.

Prompt: Four equally sized vertical product-photography panels in a 3:2 sheet. One full premium rear-facing triple-camera phone case per panel, standing on natural rocks. Black carbon on volcanic rock; burgundy weave on oxblood rock; navy texture on slate; ivory texture on warm travertine. Consistent framing, cinematic studio lighting and CASECLAN wordmark, with no labels, borders, UI or watermark.

## Device guide

Project file: `public/images/devices.webp` (source: `source-assets/devices.png`).

Prompt: Five equally sized panels, 3:1 total, of conceptual flagship phones emerging from the bottom edge against light warm-grey studio backgrounds: titanium triple camera, slightly smaller silver triple camera, warm white triple camera, graphite Ultra-style five-camera model, and dark unfolded book-fold smartphone. Consistent premium photography, no labels, logos or interface.

## Reprocessing

`node scripts/prepare-assets.mjs` creates the WebP derivatives and extracts the four clan panels. No external image URLs are required at runtime. All UI asset references are centralized in `lib/catalog.ts`.

