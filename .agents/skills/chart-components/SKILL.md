---
name: chart-components
description: Guidelines for building custom data visualizations and charts using raw SVG and Tailwind CSS in this project.
---

# Chart Components

Guidelines for building custom diagrams, graphs, and data visualizations directly within the project, ensuring premium glassmorphic aesthetics.

## When to use this skill
- Use this when modifying or creating new diagram types (e.g. bar charts, line charts) in views like the Dashboard or Budget view.
- Use this when ensuring charts fit seamlessly into the "Luminous Sanctuary" design system and dark/light modes.
- Do NOT use external chart libraries unless absolutely necessary. We prefer raw SVG mapping for complete creative control.

## How to use it

### Context & Approach
All interactive charts should be built with raw `<svg>` elements configured to use Vite and Tailwind. This allows specific visual paradigms such as deep backdrop blurs, glow effects, and micro-interactions.

### Grid and Axis Setup
- Provide a `MARGIN_LEFT` to accommodate Y-axis text.
- Configure `getY` and `getX` functions in the component logic that scale data to pixels.
- Use dashed lines (`strokeDasharray="4 4"`) and low opacity for grid lines.

### Modern Bar Chart Principles
1. **Dynamic Width Calculation with Fixed Gaps:** 
   Determine available space per bin and subtract a **fixed gap** (e.g., 2px) to ensure visual consistency across different data density levels:
   ```ts
   const BAR_PITCH = DRAW_WIDTH / (chartData.length || 1);
   const getX = (i: number) => MARGIN_LEFT + (i * BAR_PITCH) + (BAR_PITCH / 2);
   const BAR_GAP = 2; // Fixed gap in pixels
   const barWidth = Math.max(BAR_PITCH - BAR_GAP, 4); // Always consistent distance
   ```

2. **Rounded Corners & Gradients:**
   Always use `rx` for subtle rounded corners.
   Use `<linearGradient>` with styling defined through `currentColor` so the chart adjusts perfectly to light/dark themes. 
   - **Normal State:** Subtle gradient (e.g. 0.85 to 0.2 opacity).
   - **Hover State:** Solid fill (e.g. 1.0 opacity) for maximum impact.
   ```html
   <linearGradient id="barGradient" ...>
     <stop offset="0%" stopColor="currentColor" stopOpacity="0.85" className="text-text-primary" />
     <stop offset="100%" stopColor="currentColor" stopOpacity="0.2" className="text-text-primary" />
   </linearGradient>
   <linearGradient id="barHoverGradient" ...>
     <stop offset="0%" stopColor="currentColor" stopOpacity="1" className="text-text-primary" />
     <stop offset="100%" stopColor="currentColor" stopOpacity="1" className="text-text-primary" />
   </linearGradient>
   ```

3. **Focused Hover States & Interaction:**
   - Feedback should be locked to the bars themselves. Avoid full-column background highlights.
   - Use a gradient or solid fill on the bar during hover.
   - Ensure the interaction `<rect>` (hit area) matches the `barWidth` to avoid triggering events in the gaps.
   ```html
   <rect 
     x={getX(i) - barWidth/2} y={yPos} width={barWidth} height={barHeight} rx={4}
     fill={isHovered ? "url(#barHoverGradient)" : "url(#barGradient)"}
     className="transition-all duration-300 pointer-events-none"
   />
   ```

4. **Empty States:**
   If a data point equals `0`, render a minimal 2px tall notch to preserve chart continuity instead of leaving a visually empty gap.

### Typography
- Use `fill="currentColor" className="text-text-secondary"` for SVG axis labels, ensuring proper rendering across all theme variations.
