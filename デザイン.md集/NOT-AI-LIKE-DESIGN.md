## 0. Role of This Document

This document is the single source of truth for design, frontend implementation, accessibility, interaction behavior, and AI-assisted generation.

Its purpose is to prevent generic, mass-generated, statistically averaged interfaces and replace them with interfaces that feel:

- intentional
- calm
- structured
- editorial
- trustworthy
- durable
- human-made

This is not a mood board.
This is a production contract.

If a generated result conflicts with this document, this document wins.

---

## 1. Success Definition

A result is successful only if it satisfies all three layers below.

### 1-1. Visual Success

The UI must feel:

- clear at first glance
- restrained rather than flashy
- distinct rather than templated
- composed rather than assembled
- premium through judgment, not effects

### 1-2. Structural Success

The implementation must:

- use semantic HTML correctly
- preserve accessibility from the start
- model states explicitly
- behave correctly on mobile
- remain maintainable under change

### 1-3. Product Success

The screen must make it obvious:

- what matters most
- what the user should do next
- what happens when the system is loading, empty, failing, or complete

If the screen is visually polished but structurally weak, it fails.
If the screen is structurally sound but visually generic, it fails.

---

## 2. Non-Negotiable Principles

### 2-1. Core Priorities

Prioritize:

- intention over symmetry
- hierarchy over decoration
- structure over speed
- restraint over spectacle
- clarity over novelty
- usability over trendiness
- judgment over average-looking output

### 2-2. What We Are Explicitly Rejecting

Do not produce:

- generic SaaS-template aesthetics
- centered-everything layouts
- perfectly uniform card grids
- decorative gradients without narrative purpose
- decorative glassmorphism without information value
- excessive rounded rectangles everywhere
- glow, blur, and shadow used to simulate quality
- fake premium design
- visually modern but semantically weak code

### 2-3. Definition of the "AI Feel"

The "AI-generated feel" usually comes from:

- equal spacing everywhere
- equal visual weight everywhere
- generic safe composition
- no dominant focal point
- too much balance and not enough tension
- effects without hierarchy
- no editorial judgment
- weak copy tone
- no meaningful empty, loading, or error states
- markup built from convenience instead of semantics

This system exists to prevent those outcomes.

---

## 3. Operating Mode for AI Systems

AI is not allowed to improvise the design language.

AI must behave as:

- a strict executor
- a layout assistant
- a semantic implementation assistant
- a system-bound generator

AI must not behave as:

- a trend chaser
- a visual stylist without constraints
- an autonomous product designer
- a generator of generic "modern UI"

When uncertain, AI must choose the more restrained, more semantic, and more structurally correct option.

---

## 4. Fixed Visual Tokens

These tokens are fixed unless explicitly overridden.

### 4-1. Typography

- Font family: Inter
- Letter spacing: -0.31px across the board

### 4-2. Neutral Rules

- Use the two-surface system as the foundation
- Do not introduce additional background surfaces casually
- Use visual separation through spacing, density, border, and composition before adding color

### 4-3. Token Discipline

- Do not add values because they "look nicer"
- Do not create one-off exceptions without a documented reason
- Do not allow gradual token drift across components

---

## 5. Composition System

### 5-1. Primary Composition Rule

Each screen must have exactly one dominant focal point.

A dominant focal point may be:

- a hero message
- a primary form
- a key data table
- a major call to action
- a primary preview panel

If more than one block competes for first attention, the composition is unfinished.

### 5-2. Visual Weight Rules

Use differences in:

- size
- position
- spacing
- typography
- density
- contrast

Do not rely on decoration alone.

### 5-3. Asymmetry Rule

Do not default to perfect symmetry.

At least one of the following should introduce purposeful tension:

- uneven column balance
- different block scales
- off-center primary alignment
- unequal negative space
- a large block paired with smaller support blocks

### 5-4. Forbidden Composition Patterns

Do not use:

- three identical cards as the main story of the screen
- fully centered one-column layouts by default
- equal-width sections with equal rhythm from top to bottom
- visually balanced screens that have no focal hierarchy
- decorative panels that do not improve understanding

---

## 6. Spacing System

Spacing is a structural tool.
It is not filler.

### 6-1. Spacing Philosophy

Spacing must communicate:

- grouping
- separation
- importance
- breathing room
- pace

### 6-2. Spacing Hierarchy

Spacing must be judged in this order:

1. between major sections
2. around the primary focal area
3. between related content groups
4. between text and controls
5. within individual components

### 6-3. Required Spacing Behavior

- Section spacing must be clearly larger than component spacing
- Primary areas must have more surrounding space than secondary areas
- Related items must be closer to each other than to unrelated items
- Dense areas and open areas must coexist intentionally

### 6-4. Forbidden Spacing Behavior

Do not use:

- uniform spacing everywhere
- identical card padding regardless of content type
- section spacing that feels barely larger than component spacing
- spacing systems that feel machine-generated
- perfect rhythm without editorial variation

---

## 7. Typography System

### 7-1. Typographic Goals

Typography must create:

- hierarchy
- rhythm
- readability
- calm
- precision

### 7-2. Required Rules

- Use Inter consistently
- Use -0.31px letter spacing consistently
- Use a disciplined type scale
- Use fewer, stronger heading moments
- Keep body text highly readable
- Let support text remain quiet
- Use weight and placement before adding color emphasis

### 7-3. Long-Form Readability Rules

For paragraphs and explanatory text:

- prefer readable line lengths
- avoid oversized body text
- avoid compressed line-height
- avoid weak contrast
- keep text blocks visually calm

### 7-4. Forbidden Typography Patterns

Do not:

- use too many font sizes
- bold too many elements
- make captions compete with headings
- overuse pale gray text
- vary letter spacing per component without a clear reason
- fake hierarchy by only increasing font size

---

## 8. Color and Surface Rules

### 8-1. Color Philosophy

Color must express role, not style.

### 8-2. Accent Usage

- Use one accent family for primary interactive emphasis
- Use state colors only for state meaning
- Do not let accents compete with each other

### 8-3. Color Constraints

- Do not add color to every section
- Do not use surface color as a substitute for layout structure
- Do not use multiple accent colors in the same viewport unless they represent distinct system states

### 8-4. Forbidden Color Behavior

Do not produce:

- rainbow UI
- low-contrast text
- aggressive color-coded sections
- competing primary actions in different colors
- decorative gradients used as quality camouflage

---

## 9. Border, Radius, and Shadow Discipline

### 9-1. Structural Separation Rule

For any component, choose one primary separation method:

- border
- surface difference
- shadow

Do not rely on all three at once unless there is a very strong documented reason.

### 9-2. Radius Rule

Use radius with restraint.
Radius must support softness and usability, not become a stylistic default applied everywhere.

### 9-3. Shadow Rule

Shadows must be subtle and structural.

Do not use shadows to:

- simulate depth without hierarchy
- make weak layout decisions look premium
- create decorative fog around components

### 9-4. Forbidden Surface Styling

Do not produce:

- glow-based emphasis
- excessive blur
- stacked shadows
- over-soft card systems
- "premium by blur" styling

---

## 10. Component Behavior Rules

### 10-1. Buttons

Buttons are decision points.

Required behavior:

- one clear primary button per action area
- secondary actions must be visually quieter
- priority must be visible through placement and styling
- labels must be explicit and understandable
- icon-only actions must be rare and justified

Forbidden behavior:

- multiple equally strong primary buttons
- decorative button styles that overpower content
- unclear button labels
- icon-only primary actions
- exaggerated hover motion

### 10-2. Cards

Cards are optional structures, not default wrappers.

Required behavior:

- use cards only when they improve grouping or scanning
- differentiate primary and secondary cards
- let content determine density

Forbidden behavior:

- wrapping everything in cards
- endless identical card grids
- decorative cards without structural purpose
- containers more noticeable than their content

### 10-3. Forms

Forms must feel guided and stable.

Required behavior:

- every field must have a label
- helper text must be concise
- required status must be explicit
- validation must be understandable
- error states must explain next action
- success, error, disabled, and loading must feel different

Forbidden behavior:

- placeholder-only labeling
- vague validation
- hidden errors
- delayed basic validation
- identical disabled and loading states

### 10-4. Tables and Lists

Required behavior:

- choose tables when comparison matters
- align values for scanning
- support hover and selected states
- preserve readability under density

Forbidden behavior:

- turning comparable data into decorative cards
- excessive row styling
- poor numeric alignment
- unclear column meaning

---

## 11. Motion System

### 11-1. Motion Philosophy

Motion must act as response, not spectacle.

### 11-2. Motion Rules

- motion must support state change and feedback
- motion must remain subtle
- transitions should feel calm and intentional
- loading feedback must reduce uncertainty
- skeletons are preferred over generic spinners when structure matters

### 11-3. Duration Guidance

As a default range:

- micro feedback: 120ms to 180ms
- standard transitions: 160ms to 240ms
- larger contextual changes: 180ms to 280ms

Do not exceed these ranges without a clear reason.

### 11-4. Forbidden Motion

Do not use:

- constant decorative motion
- floating idle motion
- long theatrical transitions
- exaggerated bounce
- visual noise disguised as polish

---

## 12. Content and Copy Rules

### 12-1. Content Philosophy

Content must support real user intent in a real moment.

### 12-2. Required Tone

The interface must sound:

- clear
- calm
- practical
- concise
- respectful
- confident without hype

### 12-3. Copy Rules

- prefer concrete wording over abstract benefit language
- say what the user can do next
- keep error copy constructive
- keep success copy quiet
- avoid filler language
- avoid brand-sounding language unless the product explicitly requires it

### 12-4. Forbidden Copy Style

Do not use:

- hype language
- vague claims
- innovation clichés
- stock corporate phrasing
- empty productivity language
- copy that sounds machine-translated

---

## 13. Semantic HTML Contract

### 13-1. Core Rule

Use semantic elements whenever they exist.

### 13-2. Required Semantics

- use `main` for the main page content
- use `nav` for navigation
- use `header` and `footer` when structurally appropriate
- use `section` for meaningful content groups
- use `button` for actions
- use `a` for navigation
- use heading levels in logical order
- use `label` for form controls
- use lists when content is actually a list
- use tables when content is tabular

### 13-3. Hard Bans

Do not use:

- `div onClick` instead of `button`
- fake buttons built from non-interactive tags
- fake headings made from styled text only
- unlabeled fields
- broken heading hierarchy
- markup that only describes appearance and not meaning

### 13-4. Semantic Quality Checks

A screen fails semantic review if:

- an action is not keyboard reachable
- form fields are unlabeled
- landmarks are missing in meaningful layouts
- table-like data is not expressed as a table
- the heading order is illogical

---

## 14. Accessibility Contract

Accessibility is a launch condition.

### 14-1. Required Accessibility Rules

- keyboard-only navigation must work
- focus states must be visible
- touch targets must be usable
- color must not be the only meaning carrier
- text contrast must meet accessible readability standards
- state-dependent ARIA must be used where appropriate
- error messages must be perceivable and understandable
- visual order and reading order must remain coherent

### 14-2. Minimum Accessibility Bar

Design and implementation must target WCAG 2.2 AA behavior for normal product interfaces.

### 14-3. Touch Target Rule

Interactive targets should not fall below 44px by 44px unless there is a justified dense data case with an alternative accessible path.

### 14-4. Forbidden Accessibility Failures

Do not ship:

- invisible focus
- mouse-only interaction
- unlabeled controls
- low-contrast text
- color-only state signaling
- inaccessible form errors
- keyboard traps

---

## 15. State Design Contract

### 15-1. Required States

Every interactive screen must explicitly consider:

- default
- hover
- focus
- active
- disabled
- loading
- success
- error
- empty

### 15-2. State Rules

- every major action must have visible feedback
- loading must look different from disabled
- empty must not look like broken
- failure must not be silent
- success must not be over-celebrated
- async progression must be understandable

### 15-3. Required Empty State Behavior

An empty state must explain:

- what is absent
- why it may be absent, when relevant
- what the user can do next

### 15-4. Forbidden State Behavior

Do not:

- leave blank gaps during important state transitions
- suppress errors
- show identical visuals for blocked and loading states
- make empty states feel accidental

---

## 16. Responsive Contract

### 16-1. Primary Rule

Design mobile-first.

### 16-2. Required Responsive Behavior

- the layout must work on small screens first
- fixed widths should be avoided
- horizontal scrolling should be avoided
- readability takes priority over preserving desktop composition
- information may be re-ordered for mobile clarity
- controls must remain touch-friendly

### 16-3. Responsive Failure Conditions

A screen fails responsive review if:

- text becomes too small to read comfortably
- cards or tables overflow without intentional handling
- controls become hard to tap
- the mobile screen feels like a shrunken desktop layout
- primary actions become hard to find

---

## 17. Frontend Engineering Contract

### 17-1. Engineering Goals

Code must be:

- maintainable
- explicit
- testable
- readable
- safe under change

### 17-2. Required Engineering Rules

- separate UI concerns from business logic
- keep state transitions explicit
- handle async flow intentionally
- handle error cases intentionally
- consider null, empty, and failure states
- validate and sanitize user input where needed
- avoid hardcoded values that should be systemized

### 17-3. Forbidden Code Smells

Do not produce:

- div soup
- empty catch blocks
- immediate invocation mistakes in event handlers
- hidden side effects
- dead code
- scattered magic values
- logic that only works on the happy path

### 17-4. Maintainability Rule

If a future developer cannot understand the structure and state model quickly, the implementation is not finished.

---

## 18. Security and Performance Contract

### 18-1. Security

- never trust user input
- treat HTML injection as dangerous by default
- avoid unsafe APIs unless absolutely necessary
- verify external dependencies before using them
- do not leak internal information through user-facing errors

### 18-2. Performance

- do not accept "works" as the performance standard
- avoid unnecessary re-renders
- avoid wasteful loops
- consider large data sets
- design for perceived speed and real speed
- use progressive disclosure when density is high

### 18-3. Performance Failure Conditions

A screen fails performance review if:

- it visibly lags during ordinary interaction
- loading behavior is confusing
- large lists are handled naively
- layout shifts damage usability
- expensive effects replace structural clarity

---

## 19. AI Generation Contract

Treat every AI request as a specification.

### 19-1. Every Prompt Must Define

- screen purpose
- primary user
- main tasks
- information priority
- dominant focal point
- required states
- responsive expectations
- allowed components
- forbidden patterns
- semantic HTML constraints
- accessibility constraints
- token constraints
- copy tone constraints

### 19-2. Mandatory Negative Prompts

Explicitly forbid:

- generic SaaS-template aesthetics
- perfectly symmetrical card grids
- centered-everything layouts
- repeated identical cards as the main composition
- decorative gradients without purpose
- meaningless glassmorphism
- blur and glow used as premium shortcuts
- uniform spacing everywhere
- weak hierarchy
- div soup
- unlabeled forms
- missing focus states
- mobile-breaking fixed widths
- excessive rounding everywhere
- decorative motion used only for style
- one-off token values

### 19-3. Generation Sequence

For complex screens, generate in this order:

1. information structure
2. semantic layout
3. responsive layout
4. state model
5. component selection
6. visual hierarchy
7. interaction polish

Do not attempt full visual polish before structure and states are correct.

### 19-4. Regeneration Rule

When fixing an issue, do not regenerate the whole screen blindly.
Preserve stable parts.
Modify only the failing layer.

---

## 20. Review Workflow

Review must happen in layers, not as one vague opinion.

### 20-1. Layer 1: Composition

Check:

- Is there a clear focal point?
- Is visual priority obvious?
- Is asymmetry purposeful?
- Does the eye know where to go first?

### 20-2. Layer 2: Visual System

Check:

- Are the tokens respected?
- Is the two-surface system preserved?
- Is spacing meaningfully varied?
- Is the result restrained rather than effect-heavy?

### 20-3. Layer 3: Semantics and Accessibility

Check:

- Is semantic HTML correct?
- Are controls accessible?
- Are labels and headings correct?
- Is keyboard access preserved?

### 20-4. Layer 4: State and Interaction

Check:

- Are all required states designed?
- Is feedback clear?
- Does loading feel intentional?
- Do error and empty states guide next action?

### 20-5. Layer 5: Engineering Quality

Check:

- Is the code maintainable?
- Is logic separated from presentation?
- Are edge cases handled?
- Are unsafe patterns absent?

---

## 21. Weighted Scorecard

Use this scorecard for design review.
Passing score: 90 or above.
Target score: 95 or above.

### 21-1. Composition and Hierarchy — 20 points

- clear focal point: 5
- strong visual priority: 5
- purposeful asymmetry: 5
- no generic template feel: 5

### 21-2. Spacing and Rhythm — 15 points

- meaningful spacing variation: 5
- strong section rhythm: 5
- dense and open zones used intentionally: 5

### 21-3. Typography and Copy — 15 points

- disciplined typography: 5
- readable text blocks: 5
- clear and concrete copy: 5

### 21-4. Color and Surface Discipline — 10 points

- token compliance: 4
- restrained color usage: 3
- proper surface usage: 3

### 21-5. Semantics and Accessibility — 15 points

- semantic HTML correctness: 5
- keyboard and focus usability: 5
- accessible labeling and feedback: 5

### 21-6. State Design and Interaction — 15 points

- complete state coverage: 5
- clear interaction feedback: 5
- useful empty and error states: 5

### 21-7. Engineering Quality — 10 points

- maintainable structure: 4
- safe state and async handling: 3
- no major code smells: 3

---

## 22. Ship Blockers

Do not ship if any of the following are true:

- no clear focal point exists
- the interface feels generic or templated
- semantic HTML is broken
- keyboard navigation fails
- focus is not visible
- form fields lack labels
- loading, error, or empty states are missing
- the layout breaks on mobile
- the design ignores the two-surface system
- token drift is present
- decorative effects are doing the work of hierarchy
- code smells indicate unsafe or fragile behavior

Any single ship blocker is enough to fail release.

---

## 23. Final Instruction to Any AI System

Do not generate a generic modern interface.

Do not simulate quality with symmetry, repetition, blur, glow, gradient, or oversized rounded boxes.

Instead:

- create hierarchy through composition
- create clarity through spacing
- create trust through structure
- create calm through restraint
- use semantic HTML
- preserve accessibility
- model all important states
- respect the token system
- keep the result quiet, precise, and human-made

The final result must look judged, edited, and intentionally composed by a skilled human.
