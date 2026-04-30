# Liquid Glass Design System

A complete, production-ready component library featuring modern glassmorphism aesthetics with multi-layered transparency, backdrop blur effects, and fluid organic shapes.

## 🎨 Design Philosophy

The Liquid Glass Design System embodies the following principles:

- **Multi-layered Transparency**: Components use varying opacity levels (0.15–0.45) for depth perception
- **Backdrop Blur**: 12–24px blur for legibility over dynamic backgrounds
- **Light Refraction**: Subtle gradients and inner highlights (rgba(255,255,255,0.35))
- **Organic Shapes**: Fluid border-radius values (8px–24px) for natural aesthetics
- **Accessible Contrast**: Maintains WCAG AA standards (≥4.5:1) for text readability

## 🔧 Design Tokens

### Blur Values
```css
--glass-blur-sm: 12px;
--glass-blur-md: 16px;
--glass-blur-lg: 24px;
--glass-blur-xl: 32px;
```

### Opacity Layers
```css
--glass-opacity-subtle: 0.15;
--glass-opacity-light: 0.25;
--glass-opacity-medium: 0.35;
--glass-opacity-strong: 0.45;
```

### Border Radius
```css
--glass-radius-sm: 8px;
--glass-radius-md: 12px;
--glass-radius-lg: 16px;
--glass-radius-xl: 24px;
--glass-radius-pill: 9999px;
```

### Shadows
```css
--glass-shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
--glass-shadow-md: 0 4px 16px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08);
--glass-shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1);
--glass-shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.2), 0 8px 16px rgba(0, 0, 0, 0.12);
```

### Spacing System (8px base)
```css
--space-1: 8px;
--space-2: 16px;
--space-3: 24px;
--space-4: 32px;
--space-5: 40px;
--space-6: 48px;
--space-8: 64px;
```

## 📦 Components

### Buttons
- **Variants**: Primary, Secondary, Ghost, Success, Danger
- **Sizes**: Small, Medium, Large
- **Features**: Icon support (left/right), full width, disabled states
- **States**: Default, Hover (scale 1.02x, blur +4px), Active (press -2px), Focus (2px outline), Disabled (opacity 0.5)

```tsx
import { GlassButton } from './components/glass';

<GlassButton variant="primary" size="md" icon={<Icon />}>
  Click Me
</GlassButton>
```

### Form Inputs

#### Text Input
- Floating labels
- Icon support
- Error states
- Helper text

```tsx
import { GlassInput } from './components/glass';

<GlassInput
  label="Username"
  icon={<User />}
  error="This field is required"
  helperText="Choose a unique username"
/>
```

#### Textarea
- Floating labels
- Resizable/fixed
- Error states

```tsx
import { GlassTextarea } from './components/glass';

<GlassTextarea
  label="Message"
  rows={4}
  error="Message is too short"
/>
```

#### Select
- Floating labels
- Custom dropdown styling
- Error states

```tsx
import { GlassSelect } from './components/glass';

<GlassSelect
  label="Choose option"
  options={[
    { value: 'opt1', label: 'Option 1' },
    { value: 'opt2', label: 'Option 2' }
  ]}
/>
```

### Cards
- Header, body, footer sections
- Padding variants: none, sm, md, lg
- Hover effects
- Auto-layout with proper spacing

```tsx
import { GlassCard } from './components/glass';

<GlassCard
  header={<h3>Card Title</h3>}
  footer={<button>Action</button>}
  padding="md"
  hover
>
  Card content here
</GlassCard>
```

### Form Controls

#### Toggle Switch
```tsx
import { GlassToggle } from './components/glass';

<GlassToggle label="Enable feature" defaultChecked />
```

#### Checkbox
```tsx
import { GlassCheckbox } from './components/glass';

<GlassCheckbox label="Accept terms" defaultChecked />
```

#### Radio Button
```tsx
import { GlassRadio } from './components/glass';

<GlassRadio name="plan" label="Pro Plan" />
```

### Badges
- **Variants**: Default, Primary, Success, Warning, Danger
- Pill-shaped with glass effect

```tsx
import { GlassBadge } from './components/glass';

<GlassBadge variant="success">Active</GlassBadge>
```

### Tooltips
- **Positions**: Top, Bottom, Left, Right
- Hover/focus triggered
- Backdrop blur overlay

```tsx
import { GlassTooltip } from './components/glass';

<GlassTooltip content="Helpful hint" position="top">
  <button>Hover me</button>
</GlassTooltip>
```

### Modal
- Blurred backdrop overlay
- Size variants: sm, md, lg, xl
- Header and footer sections
- ESC key to close

```tsx
import { GlassModal } from './components/glass';

<GlassModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  size="md"
  footer={<Actions />}
>
  Modal content
</GlassModal>
```

### Navigation

#### Navbar
```tsx
import { GlassNavbar } from './components/glass';

<GlassNavbar
  logo={<Logo />}
  actions={<UserMenu />}
>
  <NavLinks />
</GlassNavbar>
```

#### Sidebar
```tsx
import { GlassSidebar } from './components/glass';

<GlassSidebar
  header={<Logo />}
  footer={<UserProfile />}
>
  <Navigation />
</GlassSidebar>
```

## 🎭 Layer Structure

All glass components follow this z-index hierarchy (bottom to top):

1. **Background Blur** - Backdrop filter applied to base element
2. **Gradient Overlay** - Subtle gradient for depth (::before pseudo-element)
3. **Inner Highlight Stroke** - 1px inner glow (::after pseudo-element)
4. **Content Layer** - Text, icons, and interactive elements (z-10)

## 🎨 CSS Architecture

Components map cleanly to standard CSS properties:

- `backdrop-filter: blur()`  - Glass blur effect
- `box-shadow` - Soft diffused shadows
- `linear-gradient()` - Light refraction gradients
- `border-radius` - Organic shapes
- `opacity` and `rgba()` - Multi-layer transparency

No heavy SVG filters or non-standard effects - optimized for frontend handoff.

## 🌓 Dark Mode Support

All components automatically adapt to dark mode with adjusted:
- Highlight colors (reduced opacity)
- Background opacity (darker base)
- Border colors (reduced contrast)

## ♿ Accessibility

- WCAG AA contrast ratios maintained (≥4.5:1)
- Keyboard navigation support
- Focus states with visible outlines
- Screen reader compatible
- Proper ARIA attributes

## 🚀 Performance

- Native CSS properties only
- Hardware-accelerated transforms
- Optimized blur values
- No JavaScript-dependent styling
- Lightweight component bundle

## 📱 Responsive Design

- 8px spacing system
- Flexible grid layouts
- Mobile-first approach
- Touch-friendly targets (44px minimum)

## 🎯 Usage

### Installation
```bash
# Components are located in src/app/components/glass/
# CSS is in src/styles/liquid-glass.css
```

### Import
```tsx
import { GlassButton, GlassCard, GlassInput } from './components/glass';
```

### View Showcase
Navigate to `/glass-showcase` to see all components in action with different backgrounds.

## 📐 Design Files

All components follow consistent naming:
- `glass/button/primary/default`
- `glass/input/text/focused`
- `glass/card/with-header/hover`

## 🎨 Figma Handoff Notes

- All glass effects use native Figma features (effects panel)
- Backdrop blur values directly map to CSS
- Border radius values are exact
- Shadows can be copied directly
- Colors use RGBA for transparency
- No complex masks or boolean operations

## 🔗 Component Dependencies

- React 18.3+
- Tailwind CSS 4.0+
- lucide-react (icons)
- TypeScript 5.0+

## 📄 License

Production-ready for commercial and personal projects.

---

**View the live showcase**: Navigate to `/glass-showcase` in the application to explore all components with interactive examples on multiple background types.
