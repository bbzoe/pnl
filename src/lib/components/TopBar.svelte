<script lang="ts">
  import { settings } from '../stores';
  import type { Currency, Theme } from '../types';

  function toggleTheme() {
    settings.update(s => ({
      ...s,
      theme: s.theme === 'light' ? 'dark' : 'light'
    }));
  }

  function setCurrency(c: Currency) {
    settings.update(s => ({ ...s, currency: c }));
  }
</script>

<div class="top-bar">
  <div class="logo">PNL tracker</div>
  
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

    <button class="theme-toggle" on:click={toggleTheme} title={$settings.theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
      {#if $settings.theme === 'light'}
        <svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      {:else}
        <svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
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
    font-size: 1.5rem;
    font-weight: 800;
    letter-spacing: -0.05em;
    background: linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%);
    -webkit-background-clip: text;
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
</style>

