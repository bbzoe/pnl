<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let isOpen = false;
  export let title: string = 'Confirm';
  export let message: string = 'Are you sure?';
  export let confirmText: string = 'Confirm';
  export let cancelText: string = 'Cancel';
  export let confirmVariant: 'default' | 'danger' = 'default';

  const dispatch = createEventDispatcher();

  function close() {
    isOpen = false;
    dispatch('close');
  }

  function confirm() {
    isOpen = false;
    dispatch('confirm');
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      close();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      close();
    }
  }
</script>

{#if isOpen}
  <div 
    class="modal-backdrop" 
    on:click={handleBackdropClick}
    on:keydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="confirm-title"
  >
    <div class="modal-content">
      <div class="modal-header">
        <h3 id="confirm-title">{title}</h3>
      </div>
      
      <div class="modal-body">
        <p>{message}</p>
      </div>

      <div class="modal-footer">
        <button class="btn btn-cancel" on:click={close}>
          {cancelText}
        </button>
        <button class="btn btn-confirm" class:danger={confirmVariant === 'danger'} on:click={confirm}>
          {confirmText}
        </button>
      </div>
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
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1001;
    padding: 1rem;
  }

  .modal-content {
    background: var(--bg-primary);
    border-radius: 4px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
    border: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
  }

  .modal-header {
    padding: 1.5rem 1.5rem 1rem 1.5rem;
    border-bottom: 1px solid var(--border-color);
  }

  .modal-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .modal-body {
    padding: 1.5rem;
  }

  .modal-body p {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.5;
    color: var(--text-primary);
  }

  .modal-footer {
    padding: 1rem 1.5rem 1.5rem 1.5rem;
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    border-top: 1px solid var(--border-color);
  }

  .btn {
    padding: 0.625rem 1.25rem;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid var(--border-color);
  }

  .btn-cancel {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }

  .btn-cancel:hover {
    background: var(--bg-tertiary);
  }

  .btn-confirm {
    background: var(--accent);
    color: white;
    border-color: var(--accent);
  }

  .btn-confirm:hover {
    background: var(--accent-dark);
    border-color: var(--accent-dark);
  }

  .btn-confirm.danger {
    background: var(--color-danger);
    border-color: var(--color-danger);
  }

  .btn-confirm.danger:hover {
    background: var(--color-danger-dark);
    border-color: var(--color-danger-dark);
  }
</style>



