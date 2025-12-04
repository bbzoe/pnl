<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { settings } from '../stores';
  
  export let dateLabel: string;
  export let value: number | undefined = undefined;
  export let maxPositive: number = 0;
  export let minNegative: number = 0;
  export let isReadOnly: boolean = false;
  export let isToday: boolean = false;
  export let isOutsideMonth: boolean = false;

  const dispatch = createEventDispatcher();

  let inputValue = '';
  let isFocused = false;
  let fontSize = 1.25;
  let cellWidth = 0;
  let contentWidth = 0;

  $: {
    if (!isFocused) {
        inputValue = value !== undefined && value !== null ? value.toString() : '';
    }
  }

  // Reset font size when inputValue or cell dimensions change
  $: {
      inputValue;
      cellWidth;
      // Also dependency on currency since it affects content width
      $settings.currency;
      
      // Reset to max font size
      fontSize = 1.25;
  }

  // Shrink font size if content overflows
  $: if (cellWidth > 0 && contentWidth > 0) {
      // 1rem padding total (0.5rem each side) -> 16px roughly
      // Use slightly more buffer to be safe
      const padding = 24; 
      const maxWidth = cellWidth - padding;
      
      if (contentWidth > maxWidth && fontSize > 0.5) {
          const ratio = maxWidth / contentWidth;
          // Apply ratio but don't go too small too fast, or just apply direct?
          // Direct is better to stop overflow immediately.
          // Clamp to min 0.5rem
          fontSize = Math.max(0.5, fontSize * ratio);
      }
  }

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    inputValue = target.value;
  }

  function handleBlur() {
    isFocused = false;
    const num = parseFloat(inputValue);
    // If empty string, send null
    dispatch('change', { value: inputValue.trim() === '' || isNaN(num) ? null : num });
  }

  function handleFocus() {
    isFocused = true;
  }

  function formatValue(val: number): string {
    return Number.isInteger(val) ? val.toString() : val.toFixed(2);
  }

  // Calculate intensity locally based on input value
  function calculateIntensity(val: number, maxPos: number, minNeg: number): number {
      if (isNaN(val) || val === 0) return 0;
      
      const absVal = Math.abs(val);
      let maxAbs = 0;
      
      if (val > 0) {
          maxAbs = maxPos;
      } else {
          maxAbs = Math.abs(minNeg);
      }
      
      if (maxAbs === 0) return 0;

      // Logarithmic scale
      const ratio = Math.log(absVal + 1) / Math.log(maxAbs + 1);
      
      // Clamp 0-1
      return Math.max(0, Math.min(1, ratio));
  }

  // Determine styling class and intensity
  $: numVal = parseFloat(inputValue);
  $: statusClass = !isNaN(numVal) && inputValue !== '' 
      ? (numVal > 0 ? 'positive' : (numVal < 0 ? 'negative' : 'neutral')) 
      : '';
  $: intensity = !isNaN(numVal) ? calculateIntensity(numVal, maxPositive, minNegative) : 0;

  // HSL Calculation for better color control without opacity issues
  $: bgColorStyle = (() => {
      if (!statusClass || statusClass === 'neutral') return '';
      
      const isPositive = statusClass === 'positive';
      const isDark = $settings.theme === 'dark';
      
      // Hue: Green ~150, Red ~0 (or 360)
      const hue = isPositive ? 150 : 0; 
      
      let saturation, lightness;
      
      if (isDark) {
          // Dark Mode:
          // User requested: Lighter = Near Zero, Darker = Higher Value
          // Low Intensity: Light/Bright color (L=60%)
          // High Intensity: Dark/Deep color (L=20%)
          // Saturation: High
          saturation = 70 + (intensity * 10); 
          lightness = 60 - (intensity * 40); // 60% -> 20%
      } else {
          // Light Mode:
          // Low Intensity: Very light pastel (L=95%)
          // High Intensity: Deep color (L=40%)
          saturation = 80;
          lightness = 95 - (intensity * 55); // 95% -> 40%
      }
      
      // Dynamic Text Color based on background lightness
      // Threshold: ~50% Lightness. Below 50% -> White text. Above 50% -> Inherit (Black in Light, White in Dark?)
      // Wait, in Dark Mode, default text is White.
      // If background is L=60% (Light Green), White text might be hard to read?
      // L=60% Green + White Text = Poor contrast?
      // L=60% Green + Black Text = Good contrast.
      
      // So we need explicit text color logic based on lightness, disregarding theme default if background is painted.
      
      const textColor = lightness < 50 ? 'white' : 'black';
      
      return `background-color: hsl(${hue}, ${saturation}%, ${lightness}%); color: ${textColor};`;
  })();
</script>

<div 
  class="cell {statusClass}" 
  class:today={isToday} 
  class:outside={isOutsideMonth}
  bind:clientWidth={cellWidth}
  style="{bgColorStyle}"
>
  <div class="day-number">{dateLabel}</div>
  <div class="input-wrapper">
    {#if isReadOnly}
      <div class="readonly-text" style="font-size: {fontSize}rem">
        <div class="measure-wrapper" bind:clientWidth={contentWidth}>
            {#if value !== undefined && value !== null}
                {formatValue(value)}
                <span class="currency-label">{$settings.currency}</span>
            {/if}
        </div>
      </div>
    {:else}
      <div class="input-container" style="font-size: {fontSize}rem">
        <div class="measure-wrapper" bind:clientWidth={contentWidth}>
            <div class="auto-input-wrapper">
                <span class="input-sizer">{inputValue || '0'}</span>
                <input
                    type="number"
                    step="0.01"
                    value={inputValue}
                    on:input={handleInput}
                    on:blur={handleBlur}
                    on:focus={handleFocus}
                    placeholder=""
                />
            </div>
            {#if inputValue !== ''}
            <span class="currency-label">{$settings.currency}</span>
            {/if}
        </div>
    </div>
    {/if}
  </div>
</div>

<style>
  .cell {
    position: relative;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    min-height: 100px; /* Square-ish */
    border-radius: 2px;
    transition: transform 0.08s cubic-bezier(0.4, 0, 0.2, 1), 
                box-shadow 0.08s cubic-bezier(0.4, 0, 0.2, 1), 
                border-radius 0.08s cubic-bezier(0.4, 0, 0.2, 1),
                background-color 0.2s ease;
  }

  .cell:hover {
    transform: scale(1.05);
    z-index: 10;
    border-radius: 6px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
  }
  
  @media (max-width: 768px) {
    .cell {
      min-height: 60px;
      padding: 0.25rem;
    }
    .day-number {
      font-size: 0.75rem;
    }
    input {
      font-size: 0.875rem;
    }
    .readonly-text {
        font-size: 0.875rem;
    }
  }

  .cell.today {
    border: 3px solid var(--today-border);
  }

  .cell.outside {
    opacity: 0.4;
    pointer-events: none; /* Optional: disable editing outside month days */
  }

  .day-number {
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary);
    z-index: 1;
  }

  .input-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    z-index: 2;
  }

  .input-container {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .measure-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
  }

  .auto-input-wrapper {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  /* Sizer determines width */
  .input-sizer {
    visibility: hidden;
    font-size: 1em; /* Inherit from container */
    font-weight: 700;
    white-space: pre;
    min-width: 1ch;
    padding: 0;
    line-height: normal; /* Match input */
    height: auto; /* Allow height */
  }

  input {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
    text-align: right;
    font-size: 1em; /* Inherit from container */
    font-weight: 700;
    outline: none;
    padding: 0;
    background: transparent;
    line-height: normal;
  }

  /* Remove number spinners */
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type=number] {
    -moz-appearance: textfield;
  }

  .readonly-text {
    /* Font size handled by inline style */
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .currency-label {
      font-size: 1em; /* Inherit from container */
      font-weight: 400; /* Normal weight */
      margin-left: 0.25rem;
      /* Prevent layout shift */
      display: inline-block; 
  }

  /* Adjust input width when label is present to keep it centered visually if needed, 
     or just let flexbox handle it. 
     Since input text-align is center, adding an element next to it shifts the center. 
     Maybe position absolute the label? 
  */
  
  /* Status Colors handled via inline styles for background */
  .cell.positive, .cell.negative {
    /* No default bg color, handled by style prop */
  }
  
  .cell.positive input, .cell.positive .readonly-text, .cell.positive .currency-label,
  .cell.negative input, .cell.negative .readonly-text, .cell.negative .currency-label {
    color: inherit; /* Always inherit text color from theme (black/white) */
  }
</style>

