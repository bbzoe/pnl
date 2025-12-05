<script lang="ts">
  import { onMount } from 'svelte';

  export let message: string;
  export let duration: number = 5000;

  let visible = false;

  onMount(() => {
    // Small delay to trigger animation
    setTimeout(() => {
      visible = true;
    }, 10);
    
    const timer = setTimeout(() => {
      visible = false;
    }, duration);
    
    return () => clearTimeout(timer);
  });
</script>

<div class="toast-container" class:visible>
  <div class="toast">
    <div class="toast-icon">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
    </div>
    <div class="toast-content">
      {message}
    </div>
  </div>
</div>

<style>
  .toast-container {
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.3s ease, transform 0.3s ease;
    pointer-events: none;
  }

  .toast-container.visible {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
    pointer-events: auto;
  }

  .toast {
    background: var(--bg-primary);
    color: var(--text-primary);
    padding: 1rem 1.25rem;
    border-radius: 4px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
    border: 1px solid var(--border-color);
    max-width: 500px;
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .toast-icon {
    flex-shrink: 0;
    width: 1.25rem;
    height: 1.25rem;
    color: var(--accent);
    margin-top: 0.125rem;
  }

  .toast-icon svg {
    width: 100%;
    height: 100%;
  }

  .toast-content {
    flex: 1;
    font-size: 0.875rem;
    font-weight: 400;
    line-height: 1.5;
    color: var(--text-primary);
  }
</style>

