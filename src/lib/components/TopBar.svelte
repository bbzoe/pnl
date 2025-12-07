<script lang="ts">
  import { settings } from '../stores';
  import type { Currency, Theme } from '../types';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  function toggleTheme() {
    settings.update(s => ({
      ...s,
      theme: s.theme === 'light' ? 'dark' : 'light'
    }));
  }

  function setCurrency(c: Currency) {
    settings.update(s => ({ ...s, currency: c }));
  }

  function openSettings() {
    dispatch('openSettings');
  }
</script>

<div class="top-bar">
  <div class="logo">PnL watch</div>
  
  <div class="controls">
    <div class="currency-selector-wrapper">
      <select 
        value={$settings.currency} 
        on:change={(e) => setCurrency(e.currentTarget.value as Currency)}
      >
        <option value="USD">USD</option>
        <option value="BTC">BTC</option>
        <option value="ETH">ETH</option>
      </select>
    </div>

    <button class="settings-toggle" on:click={openSettings} title="Settings">
      <svg class="settings-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41l-0.36,2.54c-0.59,0.24-1.13,0.56-1.62,0.94l-2.39-0.96c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
      </svg>
    </button>

    <button class="theme-toggle" on:click={toggleTheme} title={$settings.theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
      {#if $settings.theme === 'light'}
        <svg class="theme-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,3c-4.97,0-9,4.03-9,9s4.03,9,9,9s9-4.03,9-9c0-0.46-0.04-0.92-0.1-1.36c-0.98,1.37-2.58,2.26-4.4,2.26 c-3.03,0-5.5-2.47-5.5-5.5c0-1.82,0.89-3.42,2.26-4.4C12.92,3.04,12.46,3,12,3L12,3z"/>
        </svg>
      {:else}
        <svg class="theme-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,9c1.65,0,3,1.35,3,3s-1.35,3-3,3s-3-1.35-3-3S10.35,9,12,9 M12,7c-2.76,0-5,2.24-5,5s2.24,5,5,5s5-2.24,5-5 S14.76,7,12,7L12,7z M2,13l2,0c0.55,0,1-0.45,1-1s-0.45-1-1-1l-2,0c-0.55,0-1,0.45-1,1S1.45,13,2,13z M20,13l2,0c0.55,0,1-0.45,1-1 s-0.45-1-1-1l-2,0c-0.55,0-1,0.45-1,1S19.45,13,20,13z M11,2v2c0,0.55,0.45,1,1,1s1-0.45,1-1V2c0-0.55-0.45-1-1-1S11,1.45,11,2z M11,20v2c0,0.55,0.45,1,1,1s1-0.45,1-1v-2c0-0.55-0.45-1-1-1C11.45,19,11,19.45,11,20z M5.99,4.58c-0.39-0.39-1.03-0.39-1.41,0 c-0.39,0.39-0.39,1.03,0,1.41l1.41,1.41c0.39,0.39,1.03,0.39,1.41,0s0.39-1.03,0-1.41L5.99,4.58z M18.36,16.95 c-0.39-0.39-1.03-0.39-1.41,0c-0.39,0.39-0.39,1.03,0,1.41l1.41,1.41c0.39,0.39,1.03,0.39,1.41,0c0.39-0.39,0.39-1.03,0-1.41 L18.36,16.95z M19.42,5.99c0.39-0.39,0.39-1.03,0-1.41c-0.39-0.39-1.03-0.39-1.41,0l-1.41,1.41c-0.39,0.39-0.39,1.03,0,1.41 s1.03,0.39,1.41,0L19.42,5.99z M7.05,18.36c0.39-0.39,0.39-1.03,0-1.41c-0.39-0.39-1.03-0.39-1.41,0l-1.41,1.41 c-0.39,0.39-0.39,1.03,0,1.41s1.03,0.39,1.41,0L7.05,18.36z"/>
        </svg>
      {/if}
    </button>
  </div>
</div>

<style>
  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0 0.25rem 0;
    margin-bottom: 0;
  }

  .logo {
    font-size: 2.25rem;
    font-weight: 800;
    letter-spacing: -0.05em;
    background: linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .controls {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .currency-selector-wrapper select {
    appearance: none;
    background: var(--bg-secondary);
    border: none;
    padding: 0.5rem 2rem 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
    cursor: pointer;
    outline: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.5rem center;
    background-size: 1rem;
    border-radius: 0;
  }

  .currency-selector-wrapper select:hover {
    background-color: var(--bg-tertiary);
  }

  .settings-toggle {
    padding: 0.5rem 0.75rem;
    border-radius: var(--radius);
    transition: background-color 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .settings-toggle:hover {
    background-color: var(--bg-secondary);
  }

  .settings-icon {
    width: 1.125rem;
    height: 1.125rem;
    color: var(--text-primary);
  }

  .theme-toggle {
    padding: 0.5rem 0.75rem;
    border-radius: var(--radius);
    transition: background-color 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .theme-toggle:hover {
    background-color: var(--bg-secondary);
  }

  .theme-icon {
    width: 1.125rem;
    height: 1.125rem;
    color: var(--text-primary);
  }

  @media (max-width: 768px) {
    .top-bar {
      padding: 0.75rem 0 0.25rem 0;
    }

    .logo {
      font-size: 1.5rem;
    }

    .controls {
      gap: 0.75rem;
    }

    .currency-selector-wrapper select {
      padding: 0.4rem 1.75rem 0.4rem 0.75rem;
      font-size: 0.8rem;
    }

    .settings-toggle,
    .theme-toggle {
      padding: 0.4rem 0.6rem;
    }

    .settings-icon,
    .theme-icon {
      width: 1rem;
      height: 1rem;
    }
  }
</style>

