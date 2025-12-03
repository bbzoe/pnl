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

    <button class="theme-toggle" on:click={toggleTheme}>
      {#if $settings.theme === 'light'}
        🌙
      {:else}
        ☀️
      {/if}
    </button>
  </div>
</div>

<style>
  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
    margin-bottom: 2rem;
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
    font-size: 1.25rem;
    padding: 0.5rem;
    border-radius: var(--radius);
    transition: background-color 0.2s;
  }
  .theme-toggle:hover {
    background-color: var(--bg-secondary);
  }
</style>

