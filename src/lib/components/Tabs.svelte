<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Calendar } from '../types';

  export let calendars: Calendar[];
  export let activeId: string;

  const dispatch = createEventDispatcher();

  let editingId: string | null = null;
  let editName = '';

  function select(id: string) {
    if (editingId) return;
    dispatch('select', id);
  }

  function add() {
    dispatch('add');
  }

  function remove(id: string, e: Event) {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this calendar?')) {
        dispatch('remove', id);
    }
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
            <button class="close-btn" on:click={(e) => remove(c.id, e)} title="Remove">
              &times;
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

<style>
  .tabs-container {
    margin-bottom: 1.5rem;
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
    padding: 0.75rem 1.25rem;
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
    opacity: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 1.1rem;
    color: var(--text-secondary);
    transition: all 0.2s;
  }

  .tab:hover .close-btn {
    opacity: 1;
  }

  .close-btn:hover {
    background-color: var(--color-danger-bg);
    color: var(--color-danger);
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

