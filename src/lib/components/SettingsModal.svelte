<script lang="ts">
  import { settings, calendars, clearAllData, importCalendars } from '../stores';
  import type { WidgetVisibility, Calendar } from '../types';
  import { createEventDispatcher } from 'svelte';
  import ConfirmModal from './ConfirmModal.svelte';

  export let isOpen = false;
  const dispatch = createEventDispatcher();

  let activeTab: 'widgets' | 'password' | 'data' = 'widgets';
  let showImportConfirm = false;
  let showClearConfirm = false;
  let pendingImportData: Calendar[] | null = null;
  let importError = '';
  let importSuccess = false;
  let exportSuccess = false;
  let fileInput: HTMLInputElement;

  // Export data as JSON file
  function handleExport() {
    const data = {
      calendars: $calendars,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pnl-watch-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    exportSuccess = true;
    setTimeout(() => exportSuccess = false, 2000);
  }

  // Trigger file input
  function handleImportClick() {
    fileInput?.click();
  }

  // Handle file selection
  function handleFileSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.calendars && Array.isArray(data.calendars)) {
          pendingImportData = data.calendars;
          showImportConfirm = true;
          importError = '';
        } else {
          importError = 'Invalid file format. Expected PnL watch backup file.';
        }
      } catch {
        importError = 'Could not parse file. Make sure it is a valid JSON file.';
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again
    target.value = '';
  }

  // Confirm import
  function confirmImport() {
    if (pendingImportData) {
      importCalendars(pendingImportData);
      pendingImportData = null;
      showImportConfirm = false;
      importSuccess = true;
      setTimeout(() => importSuccess = false, 2000);
    }
  }

  // Cancel import
  function cancelImport() {
    pendingImportData = null;
    showImportConfirm = false;
  }

  // Show clear data confirmation
  function handleClearClick() {
    showClearConfirm = true;
  }

  // Confirm clear all data
  function confirmClear() {
    clearAllData();
    showClearConfirm = false;
  }

  // Cancel clear
  function cancelClear() {
    showClearConfirm = false;
  }

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
        <button 
          class="tab {activeTab === 'data' ? 'active' : ''}"
          on:click={() => activeTab = 'data'}
        >
          Data
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
        {:else if activeTab === 'data'}
          <div class="data-settings">
            <h3>Data Management</h3>
            <p class="settings-description">Export, import, or clear your PnL data</p>
            
            <div class="data-section">
              <h4>Export Data</h4>
              <p class="section-description">Download all your calendars and data as a JSON file</p>
              <button class="btn-primary" on:click={handleExport}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export Data
              </button>
              {#if exportSuccess}
                <div class="message success">Data exported successfully!</div>
              {/if}
            </div>

            <div class="data-section">
              <h4>Import Data</h4>
              <p class="section-description">Restore data from a previously exported backup file</p>
              <input 
                type="file" 
                accept=".json"
                bind:this={fileInput}
                on:change={handleFileSelect}
                style="display: none;"
              />
              <button class="btn-secondary" on:click={handleImportClick}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Import Data
              </button>
              {#if importError}
                <div class="message error">{importError}</div>
              {/if}
              {#if importSuccess}
                <div class="message success">Data imported successfully!</div>
              {/if}
            </div>

            <div class="data-section danger-zone">
              <h4>Danger Zone</h4>
              <p class="section-description">Permanently delete all your data. This cannot be undone.</p>
              <button class="btn-danger-full" on:click={handleClearClick}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
                Remove All Data
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<ConfirmModal 
  bind:isOpen={showImportConfirm}
  title="Import Data"
  message="This will replace all your current data with the imported data. Are you sure you want to continue?"
  confirmText="Import"
  cancelText="Cancel"
  on:confirm={confirmImport}
  on:close={cancelImport}
/>

<ConfirmModal 
  bind:isOpen={showClearConfirm}
  title="Remove All Data"
  message="This will permanently delete all your calendars and PnL data. This action cannot be undone."
  confirmText="Delete Everything"
  cancelText="Cancel"
  confirmVariant="danger"
  on:confirm={confirmClear}
  on:close={cancelClear}
/>

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
  .password-settings h3,
  .data-settings h3 {
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

  /* Data settings styles */
  .data-settings {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .data-section {
    padding: 1rem;
    background: var(--bg-secondary);
    border-radius: 4px;
  }

  .data-section h4 {
    font-size: 0.9375rem;
    font-weight: 600;
    margin: 0 0 0.25rem 0;
    color: var(--text-primary);
  }

  .section-description {
    font-size: 0.8125rem;
    color: var(--text-secondary);
    margin: 0 0 1rem 0;
    line-height: 1.4;
  }

  .data-section.danger-zone {
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.2);
  }

  .data-section.danger-zone h4 {
    color: var(--color-danger);
  }

  .btn-primary,
  .btn-secondary,
  .btn-danger,
  .btn-danger-full {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    font-size: 0.875rem;
    font-weight: 600;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary svg,
  .btn-secondary svg,
  .btn-danger-full svg {
    width: 1rem;
    height: 1rem;
  }

  .btn-secondary {
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
  }

  .btn-secondary:hover {
    background: var(--border-color);
  }

  .btn-danger-full {
    background: var(--color-danger);
    color: white;
    width: 100%;
    justify-content: center;
  }

  .btn-danger-full:hover {
    background: var(--color-danger-dark);
  }
</style>

