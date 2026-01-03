# Apple HIG Dark Mode Guidelines - Implementation

This document outlines how Apple's Human Interface Guidelines for Dark Mode have been applied to DESIGNERS-OS.

## Sources

- [Apple HIG Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode)

## Key Principles Applied

### 1. Background Colors - Not Pure Black

**Guideline:** Dark Mode is not a simple color inversion. Avoid pure black (#000000) backgrounds as they can cause eye strain.

**Implementation:**

- Base background: `#121212` (7% lightness) - Soft black, easier on eyes
- Card background: `#1C1C1C` (11% lightness) - Elevated surface
- Popover background: `#212121` (13% lightness) - Most elevated

### 2. Text Colors - Off-White, Not Pure White

**Guideline:** Pure white text on dark backgrounds causes eye strain. Use soft off-white tones.

**Implementation:**

- Primary text: `#EDEDED` (93% lightness) - Soft off-white
- Secondary text: `#E0E0E0` (88% lightness) - Slightly dimmer
- Muted text: `#999999` (60% lightness) - Maintains 4.5:1 contrast ratio

### 3. Elevated Surfaces System

**Guideline:** Use different background lightness levels to create depth and hierarchy.

**Implementation:**

```
Base (background) → Card → Popover
   #121212       → #1C1C1C → #212121
   7% lightness  → 11%     → 13%
```

### 4. Semantic/Dynamic Colors

**Guideline:** Use system-defined semantic colors that automatically adapt between light and dark modes.

**Implementation:**

- All colors use CSS custom properties (variables)
- Colors automatically switch based on `.dark` class
- Primary blue adjusted for dark mode: `#2997FF` (Apple's dark mode blue)

### 5. Status Colors - Adjusted Luminance

**Guideline:** Status colors (success, warning, error) should be slightly brighter in dark mode for visibility.

**Implementation:**

- Success: 45% → 45% (maintained good contrast)
- Warning: 50% (good visibility on dark)
- Destructive: 60% (increased from 51% for better visibility)

### 6. Contrast Requirements

**Guideline:** Minimum 4.5:1 contrast ratio for normal text (WCAG AA).

**Implementation:**

- Primary text (#EDEDED) on background (#121212): ~12:1 contrast ✓
- Muted text (#999999) on background (#121212): ~5.5:1 contrast ✓
- All semantic colors tested for accessibility

### 7. Increase Contrast Accessibility

**Guideline:** Support the "Increase Contrast" accessibility setting.

**Implementation:**

```css
@media (prefers-contrast: more) {
  .dark {
    --background: 0 0% 0%;  /* Pure black */
    --foreground: 0 0% 100%; /* Pure white */
    --border: 0 0% 30%; /* Stronger borders */
  }
}
```

### 8. Borders and Separators

**Guideline:** Borders should be visible but not harsh. Use subtle tones.

**Implementation:**

- Border color: `#2E2E2E` (18% lightness)
- Semi-transparent borders used where appropriate
- Smooth transitions on hover states

### 9. Vibrancy and Glass Effects

**Guideline:** Use backdrop blur (vibrancy) to help elements stand out while maintaining depth.

**Implementation:**

```css
.glass {
  backdrop-filter: blur(20px) saturate(1.8);
  background: hsl(var(--card) / 0.8);
}

.vibrancy {
  backdrop-filter: blur(24px) saturate(1.4);
  background: hsl(var(--background) / 0.85);
}
```

### 10. Icons and SF Symbols

**Guideline:** Use SF Symbols that adapt to light/dark modes. Add borders/halos to dark icons if needed.

**Implementation:**

- All icons use Lucide React (adapts via CSS color inheritance)
- Icon colors use semantic tokens (`text-foreground`, `text-muted-foreground`)
- Primary-colored icons use `text-primary` which adapts to each mode

## Color Palette Summary

### Dark Mode

| Role | Hex | HSL |
|------|-----|-----|
| Background | #121212 | 0 0% 7% |
| Card | #1C1C1C | 0 0% 11% |
| Popover | #212121 | 0 0% 13% |
| Secondary | #242424 | 0 0% 14% |
| Border | #2E2E2E | 0 0% 18% |
| Foreground | #EDEDED | 0 0% 93% |
| Muted Text | #999999 | 0 0% 60% |
| Primary | #2997FF | 211 100% 55% |

## Testing Checklist

- [x] Both light and dark modes tested
- [x] Contrast ratios meet WCAG AA (4.5:1)
- [x] Increased contrast mode supported
- [x] Elevated surfaces create clear visual hierarchy
- [x] Status colors are visible in both modes
- [x] Text is readable without eye strain
- [x] Icons adapt correctly to each mode
- [x] Backdrop blur/vibrancy effects work properly

## Related Files

- `/index.css` - CSS variables and base styles
- `/tailwind.config.js` - Tailwind theme configuration
