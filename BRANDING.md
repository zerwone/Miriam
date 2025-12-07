# Miriam Lab Branding Guide

## Overview

This document outlines the brand identity, color palette, typography, and design tokens used throughout the Miriam Lab application.

## Logo Files

Logo files are located in `/public/`:

- **`logo-miriam-full.svg`** - Full logo with icon + wordmark (use for landing pages, headers)
- **`logo-miriam-icon.svg`** - Icon only (use for favicon, app icons, compact spaces)
- **`favicon.ico`** - Browser favicon (32x32 PNG or ICO format)

> **TODO**: Replace placeholder SVG files with final logo exports from design tool.

## Color Palette

### Primary Colors

| Color | Hex | Tailwind Token | Usage |
|-------|-----|----------------|-------|
| Miriam Purple | `#9D4EDD` | `miriam-purple` | Primary brand color, buttons, accents |
| Accent Blue | `#3B82F6` | `miriam-blue` | Secondary actions, hover states |
| Accent Green | `#22C55E` | `miriam-green` | Success states, winner highlights |
| Neutral Gray | `#9CA3AF` | `miriam-gray` | Secondary text, borders |

### Background Colors

| Color | Hex | Tailwind Token | Usage |
|-------|-----|----------------|-------|
| Background Dark | `#0B0B10` | `miriam-bg` | Main app background |
| Background Soft | `#1C1130` | `miriam-bgSoft` | Cards, elevated surfaces |
| Text Light | `#F9FAFB` | `miriam-text` | Primary text color |

### Usage in Tailwind

All brand colors are available as Tailwind utilities:

```tsx
// Backgrounds
<div className="bg-miriam-bg">...</div>
<div className="bg-miriam-bgSoft">...</div>

// Text
<p className="text-miriam-text">...</p>
<p className="text-miriam-text/60">...</p> // 60% opacity

// Brand colors
<button className="bg-miriam-purple hover:bg-miriam-blue">...</button>
<span className="text-miriam-green">Winner</span>
```

## Typography

### Font Families

| Family | Tailwind Token | Usage | Fallback |
|--------|----------------|-------|----------|
| Space Grotesk | `font-heading` | Headings, logo text, brand elements | System sans |
| Inter | `font-body` | Body text, UI elements | System sans |

### Usage

```tsx
<h1 className="font-heading text-4xl font-bold">Heading</h1>
<p className="font-body text-base">Body text</p>
```

## Design Tokens

### Button Styles

Two standard button styles are available via utility classes:

#### Primary Button
```tsx
<button className="btn-primary">Primary Action</button>
```
- Background: `miriam-purple`
- Hover: `miriam-blue`
- Text: White
- Use for: Main CTAs, primary actions

#### Secondary Button
```tsx
<button className="btn-secondary">Secondary Action</button>
```
- Background: Transparent
- Border: `miriam-gray`
- Text: `miriam-text`
- Hover: `miriam-bgSoft` background
- Use for: Secondary actions, outlines

### Component Patterns

#### Cards
```tsx
<div className="bg-miriam-bgSoft border border-miriam-gray/20 rounded-lg p-6">
  {/* Card content */}
</div>
```

#### Input Fields
```tsx
<input className="bg-miriam-bg border border-miriam-gray/30 text-miriam-text focus:ring-2 focus:ring-miriam-purple" />
```

#### Active States
- Active tabs: `border-miriam-purple text-miriam-text`
- Winner highlights: `border-miriam-green` with badge

## Brand Voice

- **Product Name**: Miriam Lab
- **Tagline**: "One prompt. Many minds."
- **Tone**: Modern, minimal, technical but approachable

## Implementation Notes

1. **Dark Mode**: The app uses a dark-first design. All components should work on `miriam-bg` background.

2. **Gradients**: Use `from-miriam-purple to-miriam-blue` for hero sections and highlights.

3. **Opacity**: Use Tailwind opacity utilities (`/60`, `/80`) for subtle text and borders.

4. **Consistency**: Always use brand color tokens instead of hard-coded hex values.

## Files Modified

- `tailwind.config.ts` - Brand color palette and font families
- `app/globals.css` - Global styles, button utilities, Google Fonts imports
- `app/layout.tsx` - Root layout with brand background and favicon
- `app/page.tsx` - Landing page with hero section
- `app/(app)/layout.tsx` - App shell with branded header
- All component files - Updated to use brand colors

## Next Steps

1. Replace placeholder SVG logos with final exports
2. Add favicon.ico to `/public/`
3. Test color contrast ratios for accessibility
4. Consider adding brand color variants for light mode (if needed)
