# Design System: PRESS UI

## 1. Visual Theme & Atmosphere

PRESS UI is a playful, tactile, retro-press interface language built from bold outlines, hard offset shadows, compact radii, and blunt press-in motion. It feels closer to a sticker sheet, print proof, or toy-like sign-up form than to a soft SaaS dashboard. The whole system is intentionally form-centric: fields, buttons, and icon actions all share the same physical shell, so the interface reads like a set of pressable objects laid onto paper.

The palette is nearly achromatic. White paper surfaces, light gray canvas panels, and dark ink strokes do most of the work. Focus blue exists as the one technical accent, reserved for focus and interactive emphasis rather than broad decoration. This keeps the system loud in shape and contrast, not loud in color.

Typography is similarly blunt and functional. System sans-serif is used throughout, with black-weight titles, semibold labels, semibold body text, and sturdy button copy. The result is compact, readable, and slightly poster-like. Combined with the hard 4px shadow and 3px press translation, the UI gives every control a physical before-and-after state.

**Key Characteristics:**
- Neo-brutalist / sticker-like / pressable visual language
- Achromatic surfaces with dark ink borders and shadows
- Default `2px` border and `5px` radius across the system
- Hard offset shadow: `4px 4px 0` with no blur
- Pressed state collapses shadow and translates `3px 3px`
- Focus blue is the only strong accent and should stay rare
- System sans typography with black-weight titles and semibold UI copy
- Compact form rhythm built from `20px` spacing and `40px` controls
- Single light-mode page by default

## 2. Color Palette & Roles

### Primary
- **Ink** (`oklch(31.71% 0 89.88)`): Primary text, default border, hard shadow color, and icon color. This is the defining "ink" stroke of the system.
- **Ink Soft** (`oklch(51.03% 0 89.88)`): Secondary text and placeholder text. Use it when content should stay legible but step back from the main action.
- **Paper** (`oklch(100% 0 89.88)`): Page background, input surfaces, and primary action surfaces. PRESS UI keeps its main interactives bright and printable.
- **Canvas** (`oklch(86.69% 0 89.88)`): Form-card background and secondary large surface. This is the light gray panel that helps the white controls stand out.
- **Focus Blue** (`oklch(63.66% 0.1730 253.36)`): Focus state and interactive emphasis. This is the only high-chroma system color.

### Semantic Roles
- **Page Background**: Paper
- **Canvas Background**: Canvas
- **Surface**: Paper
- **Surface Interactive**: Paper
- **Text Primary**: Ink
- **Text Secondary**: Ink Soft
- **Text Inverse**: Paper
- **Border Default**: Ink
- **Border Strong**: Ink
- **Border Focus**: Focus Blue
- **Action Primary**: Paper
- **Action Primary Text**: Ink
- **Shadow Hard**: Ink
- **Placeholder**: Ink Soft

### Color Principles
- Keep most surfaces achromatic and let shape carry the personality.
- Use accent blue only for focus and narrow interactive emphasis.
- Preserve strong ink contrast at all times.
- Use `oklch` tokens and semantic aliases from `:root`; avoid hardcoded component colors.
- If a darker variant is ever requested, recolor the entire local system instead of mixing dark and light shells casually.

## 3. Typography Rules

### Font Family
- **Body / UI / Heading**: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- **Mono**: `ui-monospace, SFMono-Regular, Menlo, monospace`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Notes |
|------|------|------|--------|-------------|-------|
| Title | system-ui | 20px | 900 | 24px | Primary heading, loud and compact |
| Title Sub | system-ui | 17px | 600 | 22px | Supporting copy directly under the title |
| Button | system-ui | 17px | 600 | 20px | Primary CTA text |
| Body | system-ui | 15px | 600 | 20px | Inputs and supporting UI copy |
| Label | system-ui | 15px | 600 | 20px | Form labels and small interface text |
| Icon Button | system-ui | 25px | 400 | 1 | Circular social and icon actions |

### Principles
- **Heavy title, sturdy UI**: The title carries the loudest weight at `900`, while most other interface text stays at `600`. The hierarchy comes from weight and shell treatment more than scale.
- **Compact vertical rhythm**: Most UI copy sits on `20px` line-height, keeping the system dense and poster-like rather than airy.
- **Minimal scale range**: PRESS UI does not need a large type ramp. It works best when a small set of sizes is repeated consistently.
- **Typographic controls**: Icon buttons are treated as typographic objects just as much as interactive controls.

### Tool UI Adaptation
- PRESS UI is already more tool-oriented than the landing-page systems above, but its title and button examples still skew larger than a dense SaaS workspace.
- For tool-heavy screens, use `14px` as the default for body text, inputs, and primary controls. Drop to `13px` for labels, utility rows, and compact filters, and use `12px` only for tertiary metadata.
- Keep section titles and modal headings in the `18px`-`22px` range unless the screen is intentionally poster-like. Avoid repeating `17px` button sizing across every compact toolbar or table action.
- Carry forward the hard shell, contrast, and spacing rhythm first. Treat the louder typography in this file as a stylistic ceiling, not the minimum app baseline.

## 4. Component Stylings

### Form Card
- Background: Canvas
- Padding: `20px`
- Gap: `20px`
- Border: `2px solid` Ink
- Radius: `5px`
- Shadow: `4px 4px 0` Ink
- Layout: vertical flex stack, `align-items: flex-start`, `justify-content: center`
- Use: the main tactile container for sign-up, log-in, and compact form flows

### Title Block
- Title color: Ink
- Title size: `20px`
- Title line-height: `24px`
- Title weight: `900`
- Title margin-bottom: `25px`
- Subtext color: Ink Soft
- Subtext size: `17px`
- Subtext line-height: `22px`
- Subtext weight: `600`

### Inputs
- Width: `250px`
- Height: `40px`
- Padding: `5px 10px`
- Background: Paper
- Text: Ink
- Placeholder: Ink Soft at `0.8` opacity
- Font: `15px / 20px`, weight `600`
- Border: `2px solid` Ink
- Radius: `5px`
- Shadow: `4px 4px 0` Ink
- Outline: none
- Focus: replace default outline with a visible `2px solid` Focus Blue border treatment

### Primary Button
- Width: `120px`
- Height: `40px`
- Margin top: `50px`
- Margin inline: auto
- Background: Paper
- Text: Ink
- Font: `17px / 20px`, weight `600`
- Border: `2px solid` Ink
- Radius: `5px`
- Shadow: `4px 4px 0` Ink
- Cursor: pointer
- Active: collapse shadow to `0px 0px 0` and translate `3px 3px`

### Social Button
- Width / Height: `40px`
- Background: Paper
- Text / Icon: Ink
- Font size: `25px`
- Border: `2px solid` Ink
- Radius: `9999px`
- Shadow: `4px 4px 0` Ink
- Layout: centered flex
- Icon size: `24px`
- Cursor: pointer
- Active: collapse shadow to `0px 0px 0` and translate `3px 3px`

### Shared Interactive Shell
- Inputs, CTA buttons, and social buttons should all reuse the same tactile shell:
- `2px` border
- `5px` radius for rectangular controls
- hard `4px 4px 0` shadow
- white paper surface
- pressed state with `translate(3px, 3px)` and no shadow

### Distinctive Components

**Pressable Form Stack**
- Compact single-column arrangement
- Controls feel like separate physical cutouts placed on a larger canvas card
- Best for sign-up, waitlist, and light-auth flows

**Round Social Actions**
- Circular buttons with the same shell logic as the main CTA
- Used as icon-first companion actions, not as decorative ornaments

## 5. Layout Principles

### Spacing System
- `0px`
- `5px`
- `10px`
- `20px`
- `25px`
- `40px`
- `50px`

### Grid & Container
- Primary layout is a compact vertical form stack
- Form internals use `20px` padding and `20px` gaps
- Inputs are `250px` wide by default
- The CTA is narrower (`120px`) and centered as the terminal action
- Social buttons sit in a horizontal row with `20px` gaps

### Theme Mode Policy
- **Default mode**: Build the entire page in a single light mode using Paper and Canvas surfaces with Ink text.
- **No casual mixing**: Do not introduce dark cards, dark sections, or dark controls unless the brief explicitly asks for a full dark reinterpretation.
- **Whole-system switching only**: If a dark variant is requested, switch the entire local surface-text-border-shadow system together rather than mixing tokens ad hoc.
- **Blue stays narrow**: Focus Blue is not a general accent fill. Keep it for focus and targeted emphasis.

### Four Design Principles (CRAP)
- **Contrast**: PRESS UI gets hierarchy from Ink vs Paper/Canvas contrast, hard shadows, and the rare Focus Blue accent. Make important controls louder through structure, not extra decoration.
- **Repetition**: Repeat the shared tactile shell relentlessly. If inputs, buttons, and icon buttons stop feeling like they belong to the same printed kit, the system breaks.
- **Alignment**: Keep title, subtitle, input fields, and the left edge of the form stack on the same vertical axis. The CTA may center intentionally, but other controls should not drift.
- **Proximity**: Keep title/subtitle, input groups, and action rows tightly clustered. Large gaps should signal a new chunk of meaning, not random breathing room.

### Border Radius Scale
- None: `0px`
- Small: `5px`
- Full: `9999px`

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow | Plain page surfaces and quiet structural regions |
| Hard Shell (Level 1) | `4px 4px 0 var(--color-shadow-hard)` | Form card, inputs, primary button, social buttons |
| Pressed (Level 2) | `0px 0px 0 var(--color-shadow-hard)` + `translate(3px, 3px)` | Active or pressed feedback |
| Focus (Accessibility) | `2px solid var(--color-border-focus)` | Keyboard focus and clear active targeting |

**Shadow Philosophy**: PRESS UI does not use soft depth. There is no blur, no ambient lift, and no atmospheric layering. Depth is graphic and mechanical: a hard offset shadow makes the control look stamped above the page, and the active state removes that shadow to simulate physical depression. The illusion works only if the shadow stays crisp and the press translation stays small and decisive.

## 7. Responsive Behavior

### Layout Strategy
- Keep the form single-column across breakpoints
- Preserve the tactile shell at every size
- Let controls expand to the available width on smaller screens while keeping the `40px` control height as the minimum rhythm
- Keep the CTA visually secondary in width but terminal in placement

### Touch Targets
- Source controls are `40px` tall
- Recommended production target is `44px` minimum when possible
- Social actions should scale up before they scale down

### Collapsing Strategy
- Maintain vertical stacking for the primary form
- Allow the social row to wrap when horizontal space becomes tight
- Keep the title block above the control stack
- Do not introduce multi-column layout unless the brief explicitly requires it

## 8. Accessibility & States

### Focus System
- Focus must remain visible on white surfaces
- Replace the removed outline with a clear `2px solid` Focus Blue treatment
- Do not ship a focusless variant

### Interactive States
- **Default**: white surface, dark ink border, hard offset shadow
- **Active / Pressed**: collapse shadow and translate `3px 3px`
- **Focus**: visible blue border treatment
- **Disabled**: preserve readable contrast and use `cursor: not-allowed`

### Contrast
- Text on surfaces should meet at least AA targets
- Preserve strong ink contrast on paper and canvas surfaces
- Focus indicators must stay visible against white backgrounds

### Safety Notes
- Destructive actions should require modal confirmation
- The tactile shell should not replace semantic affordance; controls must still read clearly as inputs vs buttons

## 9. Agent Prompt Guide

### Theme Decision
- Default to a single light page using Paper and Canvas surfaces.
- Do not introduce dark mode unless the brief explicitly requests a dark reinterpretation.
- Use Focus Blue only for focus and narrow interactive emphasis.

### Quick Color Reference
- Ink: `oklch(31.71% 0 89.88)`
- Ink Soft: `oklch(51.03% 0 89.88)`
- Paper: `oklch(100% 0 89.88)`
- Canvas: `oklch(86.69% 0 89.88)`
- Focus Blue: `oklch(63.66% 0.1730 253.36)`
- Border / Shadow: Ink

### Example Component Prompts
- "Create a PRESS UI form card on a light gray canvas surface. Use a 2px dark ink border, 5px radius, and a hard 4px 4px zero-blur shadow. Inside, stack content vertically with 20px gaps and 20px padding."
- "Design a PRESS UI title block: 20px system sans, weight 900, 24px line-height, dark ink color. Add supporting text below at 17px weight 600 in softer ink gray."
- "Build a PRESS UI input: 250px wide, 40px tall, white background, 2px dark ink border, 5px radius, 4px 4px hard shadow, 15px semibold text, placeholder in softer ink."
- "Create a PRESS UI CTA button: 120px by 40px, centered, white background, dark ink border and text, 5px radius, hard shadow. On active, remove the shadow and translate 3px 3px."
- "Design a row of circular social buttons: 40px square, full-pill radius, centered icons at 24px, same 2px border and hard shadow as the rest of the system."

### Iteration Guide
1. Keep CSS in the `reset -> base -> component -> utility` layer order.
2. Use `oklch` root variables and semantic aliases; do not hardcode component colors.
3. Decide the page mode first: PRESS UI defaults to a single light mode.
4. Repeat the tactile shell everywhere: `2px` border, `5px` radius, `4px 4px 0` hard shadow.
5. Keep press feedback physical: active state uses `translate(3px, 3px)` and collapses the shadow.
6. Keep surfaces mostly achromatic and reserve blue for focus and tight emphasis only.
7. Use the compact type ramp consistently: 20px/900 titles, 17px/600 subheads and buttons, 15px/600 body.
8. Preserve the `20px` spacing rhythm and `40px` control height unless the brief explicitly changes them.
9. Run a CRAP pass before finishing: strengthen contrast, repeat the shell, align the vertical axes, and keep related controls close together.
10. Preserve visible focus and aim for `44px` touch targets when adapting the source for production use.
