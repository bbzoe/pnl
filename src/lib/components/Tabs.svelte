<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Calendar } from '../types';
  import ConfirmModal from './ConfirmModal.svelte';

  export let calendars: Calendar[];
  export let activeId: string;

  const dispatch = createEventDispatcher();

  let editingId: string | null = null;
  let editName = '';
  let showConfirmModal = false;
  let calendarToDelete: string | null = null;

  function select(id: string) {
    if (editingId) return;
    dispatch('select', id);
  }

  function add() {
    dispatch('add');
  }

  function remove(id: string, e: Event) {
    e.stopPropagation();
    calendarToDelete = id;
    showConfirmModal = true;
  }

  function handleConfirm() {
    if (calendarToDelete) {
      dispatch('remove', calendarToDelete);
      calendarToDelete = null;
    }
  }

  function handleCancel() {
    calendarToDelete = null;
  }

  function startEdit(c: Calendar) {
    if (c.id === 'main') return;
    editingId = c.id;
    editName = c.name;
  }

  function finishEdit() {
    if (editingId && editName.trim()) {
      dispatch('rename', { id: editingId, name: editName.trim() });
    }
    editingId = null;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      finishEdit();
    } else if (e.key === 'Escape') {
      editingId = null;
    }
  }
</script>

<div class="tabs-container">
  <div class="tabs-scroll">
    {#each calendars as c (c.id)}
      <div 
        class="tab" 
        class:active={activeId === c.id}
        on:click={() => select(c.id)}
        on:dblclick={() => startEdit(c)}
      >
        {#if editingId === c.id}
          <input 
            type="text" 
            bind:value={editName} 
            on:blur={finishEdit}
            on:keydown={handleKeydown}
            autofocus
            class="edit-input"
          />
        {:else}
          <span class="tab-name">{c.name}</span>
          {#if c.id !== 'main'}
            <button class="close-btn" on:click={(e) => remove(c.id, e)} title="Remove" on:mouseenter={(e) => e.stopPropagation()} on:mouseleave={(e) => e.stopPropagation()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          {/if}
        {/if}
      </div>
    {/each}
    
    <button class="add-btn" on:click={add} title="Add Calendar">
      +
    </button>
  </div>
</div>

<ConfirmModal 
  bind:isOpen={showConfirmModal}
  title="Delete Calendar"
  message="Are you sure you want to delete this calendar? This action cannot be undone."
  confirmText="Delete"
  cancelText="Cancel"
  confirmVariant="danger"
  on:confirm={handleConfirm}
  on:close={handleCancel}
/>

<style>
  .tabs-container {
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  .tabs-scroll {
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
    padding-bottom: 0px;
    scrollbar-width: none; /* Hide scrollbar for cleaner look */
  }
  .tabs-scroll::-webkit-scrollbar {
    display: none;
  }

  .tab {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 0.75rem 0.75rem 1.25rem;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    border: none;
    transition: all 0.2s;
    white-space: nowrap;
    position: relative;
  }

  .tab:hover {
    color: var(--text-primary);
    background: var(--bg-secondary);
  }

  .tab.active {
    background: var(--bg-secondary);
    color: var(--text-primary);
    font-weight: 600;
  }

  .tab-name {
    user-select: none;
  }

  .close-btn {
    opacity: 0.4;
    width: 18px;
    height: 18px;
    min-width: 18px;
    min-height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    color: var(--text-secondary);
    background: transparent;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    transition: opacity 0.2s ease, color 0.2s ease, background-color 0.2s ease;
    flex-shrink: 0;
  }

  .close-btn svg {
    width: 14px;
    height: 14px;
  }

  .tab:hover .close-btn {
    opacity: 1;
  }

  .close-btn:hover {
    background-color: var(--bg-tertiary);
    color: var(--text-primary);
  }

  .close-btn:active {
    background-color: var(--bg-secondary);
  }

  .add-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    font-size: 1.5rem;
    color: var(--text-secondary);
    border-radius: var(--radius);
    transition: all 0.2s;
  }
  .add-btn:hover {
    color: var(--text-primary);
    background: var(--bg-secondary);
  }

  .edit-input {
    width: 100px;
    padding: 0 0.25rem;
    border: 1px solid var(--accent);
    border-radius: var(--radius);
    font-size: inherit;
    font-family: inherit;
  }
</style>

