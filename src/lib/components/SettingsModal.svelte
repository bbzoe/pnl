<script lang="ts">
  import { settings, calendars, clearAllData, importCalendars } from '../stores';
  import type { WidgetVisibility, Calendar } from '../types';
  import { createEventDispatcher } from 'svelte';

  export let isOpen = false;
  const dispatch = createEventDispatcher();

  let activeTab: 'widgets' | 'password' | 'data' = 'widgets';
  let showImportConfirm = false;
  let showClearConfirm = false;
  let pendingImportData: Calendar[] | null = null;
  let importError = '';
  let fileInput: HTMLInputElement;

  // Ensure widgetVisibility always exists
  $: widgetVisibility = $settings.widgetVisibility || {
    allTime: true,
    lastYear: true,
    thisYear: true,
    lastMonth: true,
    thisMonth: true,
    lastWeek: true,
    thisWeek: true
  };
  let passwordInput = '';
  let confirmPasswordInput = '';
  let currentPasswordInput = '';
  let showPasswordError = false;
  let showPasswordSuccess = false;

  function closeModal() {
    isOpen = false;
    dispatch('close');
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  }

  function toggleWidget(widgetKey: keyof WidgetVisibility) {
    settings.update(s => {
      const currentVisibility = s.widgetVisibility || {
        allTime: true,
        lastYear: true,
        thisYear: true,
        lastMonth: true,
        thisMonth: true,
        lastWeek: true,
        thisWeek: true
      };
      return {
        ...s,
        widgetVisibility: {
          ...currentVisibility,
          [widgetKey]: !currentVisibility[widgetKey]
        }
      };
    });
  }

  function handlePasswordSubmit() {
    if (passwordInput !== confirmPasswordInput) {
      showPasswordError = true;
      showPasswordSuccess = false;
      return;
    }

    if (passwordInput.length < 4) {
      showPasswordError = true;
      showPasswordSuccess = false;
      return;
    }

    // Simple hash (in production, use proper hashing)
    const hash = btoa(passwordInput);
    
    settings.update(s => ({
      ...s,
      passwordEnabled: true,
      passwordHash: hash
    }));

    passwordInput = '';
    confirmPasswordInput = '';
    showPasswordError = false;
    showPasswordSuccess = true;
    setTimeout(() => {
      showPasswordSuccess = false;
    }, 2000);
  }

  function handleDisablePassword() {
    if (currentPasswordInput) {
      // Verify password
      const hash = btoa(currentPasswordInput);
      if (hash === $settings.passwordHash) {
        settings.update(s => ({
          ...s,
          passwordEnabled: false,
          passwordHash: undefined
        }));
        currentPasswordInput = '';
        showPasswordError = false;
        showPasswordSuccess = true;
        setTimeout(() => {
          showPasswordSuccess = false;
        }, 2000);
      } else {
        showPasswordError = true;
        showPasswordSuccess = false;
      }
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      closeModal();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div class="modal-backdrop" on:click={handleBackdropClick} role="dialog" aria-modal="true">
    <div class="modal-content" on:click|stopPropagation>
      <div class="modal-header">
        <h2>Settings</h2>
        <button class="close-btn" on:click={closeModal} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>

      <div class="tabs">
        <button 
          class="tab {activeTab === 'widgets' ? 'active' : ''}"
          on:click={() => activeTab = 'widgets'}
        >
          Widgets
        </button>
        <button 
          class="tab {activeTab === 'password' ? 'active' : ''}"
          on:click={() => activeTab = 'password'}
        >
          Password
        </button>
      </div>

      <div class="tab-content">
        {#if activeTab === 'widgets'}
          <div class="widgets-settings">
            <h3>Widget Visibility</h3>
            <p class="settings-description">Toggle which widgets are displayed</p>
            
            <div class="widget-list">
              <label class="widget-item">
                <input 
                  type="checkbox" 
                  checked={widgetVisibility.allTime}
                  on:change={() => toggleWidget('allTime')}
                />
                <span>All time PnL</span>
              </label>
              
              <label class="widget-item">
                <input 
                  type="checkbox" 
                  checked={widgetVisibility.lastYear}
                  on:change={() => toggleWidget('lastYear')}
                />
                <span>Last year PnL</span>
              </label>
              
              <label class="widget-item">
                <input 
                  type="checkbox" 
                  checked={widgetVisibility.thisYear}
                  on:change={() => toggleWidget('thisYear')}
                />
                <span>This year PnL</span>
              </label>
              
              <label class="widget-item">
                <input 
                  type="checkbox" 
                  checked={widgetVisibility.lastMonth}
                  on:change={() => toggleWidget('lastMonth')}
                />
                <span>Last month PnL</span>
              </label>
              
              <label class="widget-item">
                <input 
                  type="checkbox" 
                  checked={widgetVisibility.thisMonth}
                  on:change={() => toggleWidget('thisMonth')}
                />
                <span>This month PnL</span>
              </label>
              
              <label class="widget-item">
                <input 
                  type="checkbox" 
                  checked={widgetVisibility.lastWeek}
                  on:change={() => toggleWidget('lastWeek')}
                />
                <span>Last week PnL</span>
              </label>
              
              <label class="widget-item">
                <input 
                  type="checkbox" 
                  checked={widgetVisibility.thisWeek}
                  on:change={() => toggleWidget('thisWeek')}
                />
                <span>This week PnL</span>
              </label>
            </div>
          </div>
        {:else if activeTab === 'password'}
          <div class="password-settings">
            <h3>Password Protection</h3>
            <p class="settings-description">Protect your PNL data with a password</p>
            
            {#if $settings.passwordEnabled}
              <div class="password-section">
                <h4>Disable Password</h4>
                <div class="input-group">
                  <input 
                    type="password" 
                    placeholder="Enter current password"
                    bind:value={currentPasswordInput}
                  />
                  <button class="btn-danger" on:click={handleDisablePassword}>
                    Disable
                  </button>
                </div>
              </div>
            {:else}
              <div class="password-section">
                <h4>Set Password</h4>
                <div class="input-group">
                  <input 
                    type="password" 
                    placeholder="Enter new password (min 4 characters)"
                    bind:value={passwordInput}
                  />
                </div>
                <div class="input-group">
                  <input 
                    type="password" 
                    placeholder="Confirm password"
                    bind:value={confirmPasswordInput}
                  />
                </div>
                <button class="btn-primary" on:click={handlePasswordSubmit}>
                  Set Password
                </button>
              </div>
            {/if}

            {#if showPasswordError}
              <div class="message error">
                {#if $settings.passwordEnabled}
                  Incorrect password
                {:else}
                  Passwords don't match or are too short
                {/if}
              </div>
            {/if}

            {#if showPasswordSuccess}
              <div class="message success">
                {#if $settings.passwordEnabled}
                  Password disabled
                {:else}
                  Password set successfully
                {/if}
              </div>
            {/if}
          </div>
        {/if}
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
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--border-color);
  }

  .modal-header h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
  }

  .close-btn {
    background: none;
    border: none;
    padding: 0.5rem;
    cursor: pointer;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
  }

  .close-btn:hover {
    color: var(--text-primary);
  }

  .close-btn svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .tabs {
    display: flex;
    border-bottom: 1px solid var(--border-color);
    padding: 0 1.5rem;
  }

  .tab {
    background: none;
    border: none;
    padding: 1rem 1.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-secondary);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
  }

  .tab:hover {
    color: var(--text-primary);
  }

  .tab.active {
    color: var(--text-primary);
    border-bottom-color: var(--text-primary);
  }

  .tab-content {
    padding: 1.5rem;
  }

  .widgets-settings h3,
  .password-settings h3 {
    font-size: 1.125rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
  }

  .settings-description {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin: 0 0 1.5rem 0;
  }

  .widget-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .widget-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .widget-item:hover {
    background: var(--bg-secondary);
  }

  .widget-item input[type="checkbox"] {
    width: 1.125rem;
    height: 1.125rem;
    cursor: pointer;
    accent-color: var(--text-primary);
  }

  .widget-item span {
    font-size: 0.875rem;
    color: var(--text-primary);
  }

  .password-section {
    margin-bottom: 1.5rem;
  }

  .password-section h4 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 0.75rem 0;
  }

  .input-group {
    margin-bottom: 1rem;
  }

  .input-group input {
    width: 100%;
    padding: 0.75rem;
    font-size: 0.875rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    color: var(--text-primary);
  }

  .input-group input:focus {
    outline: none;
    border-color: var(--text-primary);
  }

  .btn-primary,
  .btn-danger {
    padding: 0.75rem 1.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .btn-primary {
    background: var(--text-primary);
    color: var(--bg-primary);
  }

  .btn-primary:hover {
    opacity: 0.9;
  }

  .btn-danger {
    background: var(--color-danger);
    color: white;
  }

  .btn-danger:hover {
    opacity: 0.9;
  }

  .message {
    padding: 0.75rem;
    border-radius: 4px;
    font-size: 0.875rem;
    margin-top: 1rem;
  }

  .message.error {
    background: rgba(239, 68, 68, 0.1);
    color: var(--color-danger);
  }

  .message.success {
    background: rgba(16, 185, 129, 0.1);
    color: var(--color-success);
  }
</style>

