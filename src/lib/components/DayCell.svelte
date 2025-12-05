<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
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
  let inputElement: HTMLInputElement | null = null;
  let isMobile = false;

  // Detect mobile on mount and resize
  onMount(() => {
    const checkMobile = () => {
      isMobile = window.innerWidth <= 768;
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  });

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
    // Replace all commas with dots for decimal separator
    // Input type="number" will automatically handle only one decimal point
    inputValue = target.value.replace(/,/g, '.');
    
    // Update data in real-time as user types
    const normalizedValue = inputValue.replace(/,/g, '.');
    const num = parseFloat(normalizedValue);
    dispatch('change', { value: normalizedValue.trim() === '' || isNaN(num) ? null : num });
  }

  function handleBlur() {
    isFocused = false;
    // Ensure all commas are replaced with dots before parsing
    const normalizedValue = inputValue.replace(/,/g, '.');
    const num = parseFloat(normalizedValue);
    // If empty string, send null
    dispatch('change', { value: normalizedValue.trim() === '' || isNaN(num) ? null : num });
  }

  function handleFocus() {
    isFocused = true;
  }

  function handleCellClick(e: MouseEvent) {
    if (isReadOnly) {
      dispatch('readonly-click');
      return;
    }
    
    // In mobile, open modal instead of focusing input
    if (isMobile) {
      dispatch('mobile-edit');
      return;
    }
    
    // Don't focus if clicking directly on input
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT') return;
    
    // Prevent default to avoid any interference
    e.preventDefault();
    
    // Focus input, using setTimeout to ensure it works even if another cell has focus
    if (inputElement) {
      setTimeout(() => {
        if (inputElement) {
          inputElement.focus();
          // Select all text if there's a value, so user can immediately type to replace
          if (inputValue) {
            inputElement.select();
          }
        }
      }, 0);
    }
  }

  function handleCellKeydown(e: KeyboardEvent) {
    if (!isReadOnly && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      if (inputElement) {
        inputElement.focus();
      }
    }
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
      
      // Calculate border color: same hue and saturation, but different lightness
      // Light mode: darker border (reduce lightness by 25-30% for better contrast)
      // Dark mode: lighter border (increase lightness by 25-30% for better contrast)
      let borderLightness;
      if (isDark) {
          // Dark mode: make border lighter (add 25-30% of remaining lightness range)
          const lightnessRange = 100 - lightness;
          borderLightness = Math.min(100, lightness + (lightnessRange * 0.3));
      } else {
          // Light mode: make border darker (reduce by 25-30% of current lightness)
          borderLightness = Math.max(0, lightness - (lightness * 0.3));
      }
      const borderColor = `hsl(${hue}, ${saturation}%, ${borderLightness}%)`;
      
      // For "today" cells, don't set border-color in inline style - let CSS .cell.today handle it
      if (isToday) {
          return `background-color: hsl(${hue}, ${saturation}%, ${lightness}%); color: ${textColor};`;
      }
      
      return `background-color: hsl(${hue}, ${saturation}%, ${lightness}%); color: ${textColor}; border-color: ${borderColor};`;
  })();

  // Calculate day number color based on background lightness
  // Use slightly higher threshold for day number to ensure better contrast
  $: dayNumberColor = (() => {
      if (!statusClass || statusClass === 'neutral') {
          // Default color for neutral cells - use theme's secondary text color
          return 'var(--text-secondary)';
      }
      
      const isPositive = statusClass === 'positive';
      const isDark = $settings.theme === 'dark';
      
      const hue = isPositive ? 150 : 0;
      let saturation, lightness;
      
      if (isDark) {
          saturation = 70 + (intensity * 10);
          lightness = 60 - (intensity * 40); // 60% -> 20%
      } else {
          saturation = 80;
          lightness = 95 - (intensity * 55); // 95% -> 40%
      }
      
      // For day number, use threshold of 55% for better contrast
      // Adjust threshold slightly based on theme for optimal visibility
      const threshold = isDark ? 50 : 55;
      
      if (lightness < threshold) {
          // Dark background - use white for maximum contrast
          // In light mode, use pure white; in dark mode, use slightly off-white for better visibility on colored backgrounds
          return isDark ? '#f5f5f5' : '#ffffff';
      } else {
          // Light background - use dark color for maximum contrast
          // In light mode, use pure black; in dark mode, use very dark gray
          return isDark ? '#0a0a0a' : '#000000';
      }
  })();
</script>

<div 
  class="cell {statusClass}" 
  class:today={isToday} 
  class:outside={isOutsideMonth}
  bind:clientWidth={cellWidth}
  style="{bgColorStyle}"
  on:click={handleCellClick}
  on:keydown={handleCellKeydown}
  role="button"
  tabindex="0"
>
  <div class="day-number" style="color: {dayNumberColor}">{dateLabel}</div>
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
                <span class="input-sizer">{inputValue || (isFocused ? '0' : '0')}</span>
                <input
                    type="text"
                    inputmode="decimal"
                    pattern="[0-9]*\.?[0-9]*"
                    bind:this={inputElement}
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
    border-radius: 4px;
    transition: transform 0.08s cubic-bezier(0.4, 0, 0.2, 1), 
                box-shadow 0.08s cubic-bezier(0.4, 0, 0.2, 1), 
                border-radius 0.08s cubic-bezier(0.4, 0, 0.2, 1),
                background-color 0.2s ease,
                border-color 0.2s ease;
  }

  .cell:not(.outside) {
    cursor: pointer;
  }

  .cell:hover {
    transform: scale(1.05);
    z-index: 10;
    border-radius: 8px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
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
    /* Color is set dynamically via inline style based on background */
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

  /* No spinners needed for text input with inputmode="decimal" */

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
  
  .cell.positive input, .cell.positive .readonly-text, .cell.positive .currency-label,
  .cell.negative input, .cell.negative .readonly-text, .cell.negative .currency-label {
    color: inherit; /* Always inherit text color from theme (black/white) */
  }

  /* Mobile styles - must be at end to override */
  @media (max-width: 1024px) {
    .cell {
      min-height: 50px;
      padding: 0.25rem;
      justify-content: center;
      align-items: center;
    }
    .day-number {
      position: static !important;
      font-size: 1rem !important;
      font-weight: 600;
      text-align: center;
      top: auto !important;
      left: auto !important;
    }
    .input-wrapper {
      display: none !important;
    }
  }
</style>

