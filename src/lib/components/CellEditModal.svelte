<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte';
  import { settings } from '../stores';

  export let isOpen = false;
  export let date: Date | null = null;
  export let value: number | undefined = undefined;
  export let maxPositive: number = 0;
  export let minNegative: number = 0;

  const dispatch = createEventDispatcher();

  let inputValue = '';
  let inputElement: HTMLInputElement | null = null;
  let sizerElement: HTMLSpanElement | null = null;
  let fontSize = 4; // rem
  const baseFontSize = 4; // rem
  const minFontSize = 1.5; // rem
  const maxWidth = 280; // px - max width for value+currency
  let hasInitialized = false;

  $: if (isOpen && date && !hasInitialized) {
    hasInitialized = true;
    inputValue = value !== undefined && value !== null ? value.toString() : '';
    fontSize = baseFontSize;
    // Focus input after modal opens
    setTimeout(async () => {
      await tick();
      updateFontSize();
      updateInputWidth();
      if (inputElement) {
        inputElement.focus();
        inputElement.select();
      }
    }, 100);
  }
  
  // Reset flag when modal closes
  $: if (!isOpen) {
    hasInitialized = false;
  }

  // Update font size based on content width
  function updateFontSize() {
    if (!sizerElement) return;
    
    const displayText = inputValue || '0';
    const currency = $settings.currency;
    const fullText = displayText + ' ' + currency;
    
    // Reset to base size for measurement
    sizerElement.style.fontSize = baseFontSize + 'rem';
    sizerElement.textContent = fullText;
    
    const measuredWidth = sizerElement.offsetWidth;
    
    if (measuredWidth > maxWidth) {
      const scale = maxWidth / measuredWidth;
      fontSize = Math.max(minFontSize, baseFontSize * scale);
    } else {
      fontSize = baseFontSize;
    }
  }

  // Calculate cell background color (same logic as DayCell)
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
    const ratio = Math.log(absVal + 1) / Math.log(maxAbs + 1);
    return Math.max(0, Math.min(1, ratio));
  }

  $: numVal = parseFloat(inputValue);
  $: statusClass = !isNaN(numVal) && inputValue !== '' 
    ? (numVal > 0 ? 'positive' : (numVal < 0 ? 'negative' : 'neutral')) 
    : (value !== undefined && value !== null ? (value > 0 ? 'positive' : (value < 0 ? 'negative' : 'neutral')) : 'neutral');
  $: intensity = !isNaN(numVal) ? calculateIntensity(numVal, maxPositive, minNegative) : (value !== undefined && value !== null ? calculateIntensity(value, maxPositive, minNegative) : 0);

  $: bgColorStyle = (() => {
    if (!statusClass || statusClass === 'neutral') {
      return 'background-color: var(--bg-secondary); color: var(--text-primary);';
    }
    
    const isPositive = statusClass === 'positive';
    const isDark = $settings.theme === 'dark';
    const hue = isPositive ? 150 : 0;
    
    let saturation, lightness;
    if (isDark) {
      saturation = 70 + (intensity * 10);
      lightness = 60 - (intensity * 40);
    } else {
      saturation = 80;
      lightness = 95 - (intensity * 55);
    }
    
    const textColor = lightness < 50 ? 'white' : 'black';
    return `background-color: hsl(${hue}, ${saturation}%, ${lightness}%); color: ${textColor};`;
  })();

  // Extract background color for hover effect
  $: backgroundColor = (() => {
    if (!statusClass || statusClass === 'neutral') {
      return 'var(--bg-secondary)';
    }
    
    const isPositive = statusClass === 'positive';
    const isDark = $settings.theme === 'dark';
    const hue = isPositive ? 150 : 0;
    
    let saturation, lightness;
    if (isDark) {
      saturation = 70 + (intensity * 10);
      lightness = 60 - (intensity * 40);
    } else {
      saturation = 80;
      lightness = 95 - (intensity * 55);
    }
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  })();

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    inputValue = target.value.replace(/,/g, '.');
    updateFontSize();
    updateInputWidth();
  }

  function toggleSign() {
    if (inputValue === '' || inputValue === '-') {
      inputValue = '-';
    } else if (inputValue.startsWith('-')) {
      inputValue = inputValue.slice(1);
    } else {
      inputValue = '-' + inputValue;
    }
    updateFontSize();
    updateInputWidth();
    // Keep focus on input
    if (inputElement) {
      inputElement.focus();
    }
  }

  function updateInputWidth() {
    if (!inputElement) return;
    const len = inputValue.length || 1;
    inputElement.style.width = Math.max(1, len) + 'ch';
  }

  function handleSave() {
    const normalizedValue = inputValue.replace(/,/g, '.');
    const num = parseFloat(normalizedValue);
    const finalValue = normalizedValue.trim() === '' || isNaN(num) ? null : num;
    dispatch('save', { value: finalValue });
    closeModal();
  }

  function handleCancel() {
    closeModal();
  }

  function closeModal() {
    isOpen = false;
    dispatch('close');
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  }
</script>

{#if isOpen && date}
  <div class="modal-backdrop" style="{bgColorStyle}">
    <button class="close-btn" on:click={closeModal} aria-label="Close">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    </button>
    
    <!-- Hidden sizer for measuring text -->
    <span class="sizer" bind:this={sizerElement} aria-hidden="true"></span>
    
    <div class="modal-content">
      <div class="input-row">
        <button class="sign-btn" on:click={toggleSign} aria-label="Toggle sign">
          +/−
        </button>
        <div class="input-wrapper" style="font-size: {fontSize}rem;">
          <input
            type="text"
            inputmode="decimal"
            bind:this={inputElement}
            bind:value={inputValue}
            on:input={handleInput}
            on:keydown={handleKeydown}
            placeholder="0"
            class="value-input"
          />
          <span class="currency">{$settings.currency}</span>
        </div>
      </div>

      <button class="change-btn" style="--bg-color: {backgroundColor};" on:click={handleSave}>
        change
      </button>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 2rem 1rem;
  }

  .close-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    cursor: pointer;
    color: currentColor;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    border-radius: 4px;
    opacity: 0.7;
    transition: opacity 0.2s;
    z-index: 1;
  }
  .close-btn:hover {
    opacity: 1;
  }
  .close-btn svg {
    width: 1.5rem;
    height: 1.5rem;
  }

  .sizer {
    position: absolute;
    visibility: hidden;
    white-space: nowrap;
    font-weight: 700;
    pointer-events: none;
  }

  .modal-content {
    width: 100%;
    max-width: 500px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3rem;
  }

  .input-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }

  .sign-btn {
    background: rgba(255, 255, 255, 0.15);
    border: 2px solid currentColor;
    color: inherit;
    font-size: 1.5rem;
    font-weight: 600;
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    opacity: 0.8;
    flex-shrink: 0;
  }

  .sign-btn:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.25);
  }

  .sign-btn:active {
    transform: scale(0.95);
  }

  .input-wrapper {
    display: inline-flex;
    align-items: baseline;
    justify-content: center;
    gap: 0.2em;
  }

  .value-input {
    border: none;
    background: transparent;
    color: inherit;
    font-size: inherit;
    font-weight: 700;
    text-align: center;
    padding: 0;
    outline: none;
    width: 1ch;
    min-width: 1ch;
    font-family: inherit;
  }

  .value-input::placeholder {
    color: inherit;
    opacity: 0.4;
  }

  .currency {
    font-size: inherit;
    font-weight: 700;
    color: inherit;
    white-space: nowrap;
  }

  .change-btn {
    padding: 0.75rem 2rem;
    border: 2px solid currentColor;
    background: transparent;
    color: currentColor;
    font-size: 1rem;
    font-weight: 600;
    text-transform: lowercase;
    cursor: pointer;
    border-radius: 0;
    transition: all 0.2s;
    opacity: 0.8;
  }

  .change-btn:hover {
    opacity: 1;
    background: white;
    border-color: white;
    color: var(--bg-color, var(--bg-primary));
  }

  @media (max-width: 768px) {
    .modal-backdrop {
      padding: 1rem;
    }

    .close-btn {
      top: 0.75rem;
      right: 0.75rem;
    }

    .modal-content {
      gap: 2.5rem;
    }

    .change-btn {
      padding: 0.625rem 1.5rem;
      font-size: 0.9rem;
    }
  }
</style>
