# Spred Design System Instructions

## Color Palette

### Primary Colors
- **Primary**: `#F45303` (Spred Orange) - Main CTAs, brand elements, active states
- **Secondary**: `#D69E2E` (Deep Amber) - Secondary actions, user profiles, gradients
- **Accent**: `#8B8B8B` (Sophisticated Grey) - Secondary text, inactive states, borders

### Background & Surface Colors
- **Background Dark**: `#1A1A1A` - Main app background
- **Surface**: `#2A2A2A` - Card backgrounds, elevated surfaces
- **Text Primary**: `#FFFFFF` - Main text on dark backgrounds
- **Text Secondary**: `#CCCCCC` - Secondary text, labels
- **Text Accent**: `#8B8B8B` - Inactive text, placeholders

## Usage Rules

### Primary Orange (#F45303)
- Main call-to-action buttons
- Logo and brand elements
- Active navigation states
- Key metrics and achievements
- Selected/active states

### Secondary Amber (#D69E2E)
- Secondary buttons and actions
- User avatars and profiles
- Progress indicators (completed states)
- Highlighted content and quotes
- Gradient combinations with primary

### Accent Grey (#8B8B8B)
- Secondary text and labels
- Inactive/disabled elements
- Borders and dividers
- Notification badges
- Subtle interactive elements

## Component Guidelines

### Buttons
```css
/* Primary Button */
background: #F45303;
color: #FFFFFF;
hover: #E04502;

/* Secondary Button */
background: #D69E2E;
color: #FFFFFF;
hover: #C8932A;

/* Outline Button */
border: 2px solid #8B8B8B;
background: transparent;
color: #8B8B8B;
hover: background #8B8B8B, color #FFFFFF;

/* Ghost Button */
background: transparent;
color: #8B8B8B;
hover: background rgba(139, 139, 139, 0.1);
```

### Cards & Surfaces
- Card backgrounds: `#2A2A2A`
- Border color: `#333333`
- Border radius: `12px` to `20px`
- Elevation: Subtle shadows using `rgba(0, 0, 0, 0.3)`

### Typography Hierarchy
- **Headings**: `#FFFFFF` (white)
- **Body text**: `#CCCCCC` (light grey)
- **Secondary text**: `#8B8B8B` (accent grey)
- **Highlighted text**: `#D69E2E` (amber)

### Progress & Status Indicators
- **Active progress**: `#F45303` or gradient `linear-gradient(90deg, #F45303, #D69E2E)`
- **Completed states**: `#D69E2E`
- **Inactive/pending**: `#8B8B8B`
- **Background track**: `#444444`

### Navigation
- **Active tab/nav**: `#F45303` background
- **Inactive tab/nav**: `#8B8B8B` text
- **Hover states**: Lighten by 10-15%

## Design Principles

1. **Warm Dominance**: Use orange and amber as the primary warm palette
2. **Grey Balance**: Use grey strategically for sophistication and hierarchy
3. **High Contrast**: Ensure WCAG AA compliance on dark backgrounds
4. **Gradient Usage**: Combine primary and secondary for premium feel
5. **Consistent Spacing**: Use 8px grid system (8, 16, 24, 32px)

## Dark Theme Specifications

- Main background: `#1A1A1A`
- Elevated surfaces: `#2A2A2A`
- Borders and dividers: `#333333`
- Input backgrounds: `#2A2A2A`
- Modal overlays: `rgba(0, 0, 0, 0.8)`

## Accessibility Requirements

- Minimum contrast ratio 4.5:1 for normal text
- Minimum contrast ratio 3:1 for large text
- Focus indicators must use primary color `#F45303`
- Interactive elements minimum 44px touch target
- Color should not be the only way to convey information

## Brand Personality

This color system should convey:
- **Energy & Passion** (Orange primary)
- **Sophistication & Premium** (Amber secondary)
- **Professional & Reliable** (Strategic grey usage)
- **Modern & Clean** (Dark theme with high contrast)

## Implementation Notes

- Prefer gradients for major CTAs: `linear-gradient(135deg, #F45303, #D69E2E)`
- Use orange sparingly but boldly for maximum impact
- Grey should feel intentional, not just "missing color"
- Maintain warm personality while ensuring professional appearance
- Test all color combinations on actual dark backgrounds
- Consider hover/active states for all interactive elements