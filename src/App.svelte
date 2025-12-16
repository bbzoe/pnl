<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    calendars, 
    mainCalendarData, 
    addCalendar, 
    removeCalendar, 
    updateCalendarName 
  } from './lib/stores';
  import CalendarView from './lib/components/Calendar.svelte';
  import TopBar from './lib/components/TopBar.svelte';
  import Tabs from './lib/components/Tabs.svelte';
  import StatsWidgets from './lib/components/StatsWidgets.svelte';
  import SettingsModal from './lib/components/SettingsModal.svelte';
  import Toast from './lib/components/Toast.svelte';
  import LineChart from './lib/components/LineChart.svelte';
  import CellEditModal from './lib/components/CellEditModal.svelte';
  import { settings, updateCell } from './lib/stores';
  import { format } from 'date-fns';
  import { isTMA, haptic, backButton } from './lib/telegram';

  let activeTab = 'main';
  let settingsOpen = false;
  let isUnlocked = false;
  let passwordInput = '';
  let passwordError = false;
  let showToast = false;
  let toastMessage = '';
  
  // View mode per calendar: 'calendar' | 'chart'
  let viewModes: Record<string, 'calendar' | 'chart'> = {};
  
  // Mobile edit modal state
  let cellEditModalOpen = false;
  let cellEditDate: Date | null = null;
  let cellEditValue: number | undefined = undefined;
  
  // Calculate max/min for color scaling
  $: visibleValues = Object.values(currentData).filter(v => v !== undefined && v !== null) as number[];
  $: maxPositive = Math.max(0, ...visibleValues.filter(v => v > 0));
  $: minNegative = Math.min(0, ...visibleValues.filter(v => v < 0));
  
  $: currentViewMode = viewModes[activeTab] || 'calendar';
  
  function toggleViewMode() {
    viewModes[activeTab] = currentViewMode === 'calendar' ? 'chart' : 'calendar';
    viewModes = { ...viewModes }; // Trigger reactivity
  }

  // Handle Tab Selection
  function handleSelect(e: CustomEvent<string>) {
    activeTab = e.detail;
  }

  // Handle Add
  function handleAdd() {
    haptic.notification('success');
    addCalendar();
    // Optional: Switch to new calendar?
    // We need the ID of the new calendar. 
    // Since addCalendar generates ID internally, we might need to peek at the store or change addCalendar to return ID.
    // For now, I'll just let the user click it, or I can find the last one.
    setTimeout(() => {
        const cals = $calendars;
        if (cals.length > 0) {
            activeTab = cals[cals.length - 1].id;
        }
    }, 10);
  }

  // Handle Remove
  function handleRemove(e: CustomEvent<string>) {
    haptic.notification('warning');
    const idToRemove = e.detail;
    removeCalendar(idToRemove);
    if (activeTab === idToRemove) {
      activeTab = 'main';
    }
  }

  // Handle Rename
  function handleRename(e: CustomEvent<{id: string, name: string}>) {
    updateCalendarName(e.detail.id, e.detail.name);
  }

  // Determine props for CalendarView
  $: activeCalendar = $calendars.find(c => c.id === activeTab);
  $: isMain = activeTab === 'main';
  $: isAggregate = isMain && $calendars.length > 1;
  
  // Data source: derived for Main if aggregate, otherwise direct
  // Use $calendars to ensure reactivity when data changes
  $: currentData = isMain 
    ? $mainCalendarData // derived store value
    : ($calendars.find(c => c.id === activeTab)?.data || {});
  
  $: isReadOnly = isAggregate;

  // Password protection logic
  $: isLocked = $settings.passwordEnabled && !isUnlocked;

  function handleOpenSettings() {
    settingsOpen = true;
  }

  function handleCloseSettings() {
    settingsOpen = false;
  }

  function handlePasswordSubmit() {
    const hash = btoa(passwordInput);
    if (hash === $settings.passwordHash) {
      isUnlocked = true;
      passwordInput = '';
      passwordError = false;
    } else {
      passwordError = true;
      passwordInput = '';
    }
  }

  function handlePasswordKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      handlePasswordSubmit();
    }
  }

  // Reset unlock state when password is disabled
  $: if (!$settings.passwordEnabled) {
    isUnlocked = true;
  }

  function showToastMessage(message: string) {
    toastMessage = message;
    showToast = true;
    setTimeout(() => {
      showToast = false;
    }, 5000);
  }

  function handleReadonlyClick() {
    showToastMessage('The General calendar cannot be edited when other calendars exist. It automatically sums results from all other calendars.');
  }

  function handleMobileEdit(e: CustomEvent<{ date: Date }>) {
    if (isReadOnly) {
      handleReadonlyClick();
      return;
    }
    const date = e.detail.date;
    const dateStr = format(date, 'yyyy-MM-dd');
    cellEditDate = date;
    cellEditValue = currentData[dateStr];
    cellEditModalOpen = true;
  }

  function handleCellSave(e: CustomEvent<{ value: number | null }>) {
    if (!cellEditDate || isReadOnly) return;
    const dateStr = format(cellEditDate, 'yyyy-MM-dd');
    updateCell(activeTab, dateStr, e.detail.value);
    cellEditModalOpen = false;
    cellEditDate = null;
    cellEditValue = undefined;
  }

  function handleCellModalClose() {
    cellEditModalOpen = false;
    cellEditDate = null;
    cellEditValue = undefined;
  } 
</script>

<div class="container" class:blurred={isLocked} class:tma-mode={$isTMA}>
  {#if !$isTMA}
    <TopBar on:openSettings={handleOpenSettings} />
  {:else}
    <!-- Minimal TMA header with settings access -->
    <div class="tma-header">
      <span class="tma-title">PnL watch</span>
      <button class="tma-settings-btn" on:click={handleOpenSettings} title="Settings">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41l-0.36,2.54c-0.59,0.24-1.13,0.56-1.62,0.94l-2.39-0.96c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
        </svg>
      </button>
    </div>
  {/if}
  
  <p class="app-description">
    Free, private PnL tracker. All data stays local, no servers, just your trades.
  </p>
  
  {#if activeCalendar || isMain}
    <StatsWidgets data={currentData} />
  {/if}
  
  <div class="tabs-and-view-toggle">
    <Tabs 
      calendars={$calendars} 
      activeId={activeTab} 
      on:select={handleSelect}
      on:add={handleAdd}
      on:remove={handleRemove}
      on:rename={handleRename}
    />
    
    <div class="view-toggle">
      <button 
        class="view-toggle-btn" 
        class:active={currentViewMode === 'calendar'}
        on:click={() => { if (currentViewMode !== 'calendar') toggleViewMode(); }}
        title="Calendar view"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </button>
      <button 
        class="view-toggle-btn" 
        class:active={currentViewMode === 'chart'}
        on:click={() => { if (currentViewMode !== 'chart') toggleViewMode(); }}
        title="Chart view"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      </button>
    </div>
  </div>

  <main class="content">
    {#if activeCalendar || isMain}
      
       <!-- Key block to force re-render/reset state when tab changes if needed, 
            though Svelte handles props updates well. 
            Using activeTab as key helps with transition/reset of internal state like current month view if desired.
            But usually we want to keep month view synced or independent? 
            Let's keep independent state per calendar? 
            CalendarView has internal 'currentDate'. If we want it to reset or persist, we depend on component instance.
            Keying by activeTab creates a new component instance each switch -> resets to current month.
            This is probably cleaner UX than sharing state.
       -->
      {#key activeTab}
        {#if currentViewMode === 'chart'}
          <LineChart data={currentData} />
        {:else}
          <CalendarView 
            calendarId={activeTab}
            data={currentData}
            isReadOnly={isReadOnly}
            on:readonly-click={handleReadonlyClick}
            on:mobile-edit={handleMobileEdit}
          />
        {/if}
      {/key}
    {:else}
      <div class="error">Calendar not found</div>
    {/if}
  </main>

  <footer class="app-footer">
    <div class="footer-content">
      <div class="footer-item">
        <span class="footer-text">Open source · Free to use</span>
        <a 
          href="https://github.com/bbzoe/pnl" 
          target="_blank" 
          rel="noopener noreferrer"
          class="footer-link"
          title="View on GitHub"
        >
          <svg class="footer-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </a>
      </div>
      <span class="footer-separator">·</span>
      <div class="footer-item">
        <span class="footer-text">Buy me a coffee</span>
        <a 
          href="ethereum:ketrab.eth"
          class="footer-link eth-link"
          title="Donate ETH to ketrab.eth"
        >
          <svg class="footer-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"/>
          </svg>
          <span class="eth-address">ketrab.eth</span>
        </a>
      </div>
      <span class="footer-separator">·</span>
      <div class="footer-item">
        <span class="footer-text">Follow me</span>
        <a 
          href="https://x.com/BilickiBartek"
          target="_blank"
          rel="noopener noreferrer"
          class="footer-link"
          title="Follow @BilickiBartek on X"
        >
          <svg class="footer-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </a>
      </div>
    </div>
  </footer>
</div>

{#if isLocked}
  <div class="password-overlay">
    <div class="password-prompt">
      <h3>Enter Password</h3>
      <input 
        type="password" 
        placeholder="Password"
        bind:value={passwordInput}
        on:keydown={handlePasswordKeydown}
        autofocus
      />
      {#if passwordError}
        <div class="password-error">Incorrect password</div>
      {/if}
      <button class="password-submit" on:click={handlePasswordSubmit}>
        Unlock
      </button>
    </div>
  </div>
{/if}

<SettingsModal bind:isOpen={settingsOpen} on:close={handleCloseSettings} />

<CellEditModal 
  bind:isOpen={cellEditModalOpen}
  date={cellEditDate}
  value={cellEditValue}
  maxPositive={maxPositive}
  minNegative={minNegative}
  on:save={handleCellSave}
  on:close={handleCellModalClose}
/>

{#if showToast}
  {#key toastMessage}
    <Toast message={toastMessage} />
  {/key}
{/if}

<style>
  /* TMA mode adjustments */
  .container.tma-mode {
    padding-top: calc(env(safe-area-inset-top, 0px) + 0.5rem);
    padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 1rem);
  }

  /* TMA minimal header */
  .tma-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    margin-bottom: 0.25rem;
  }

  .tma-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .tma-settings-btn {
    padding: 0.5rem;
    border-radius: 4px;
    background: transparent;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
  }

  .tma-settings-btn:hover {
    background-color: var(--bg-secondary);
  }

  .tma-settings-btn svg {
    width: 1.125rem;
    height: 1.125rem;
    color: var(--text-primary);
  }

  .app-description {
    font-size: 0.75rem;
    font-weight: 400;
    color: var(--text-secondary);
    line-height: 1.4;
    margin: 0.25rem 0 1.5rem 0;
    padding: 0;
    letter-spacing: -0.01em;
  }

  .tabs-and-view-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    gap: 1rem;
    flex-wrap: nowrap;
  }

  .view-toggle {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    background: var(--bg-secondary);
    padding: 0.25rem;
    border-radius: 4px;
    flex-shrink: 0;
  }

  .view-toggle-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .view-toggle-btn svg {
    width: 18px;
    height: 18px;
  }

  .view-toggle-btn:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  .view-toggle-btn.active {
    background: var(--bg-primary);
    color: var(--text-primary);
  }

  @media (max-width: 1024px) {
    .tabs-and-view-toggle {
      gap: 0.5rem;
    }
    .view-toggle {
      padding: 0.15rem;
    }
    .view-toggle-btn {
      width: 28px;
      height: 28px;
    }
    .view-toggle-btn svg {
      width: 14px;
      height: 14px;
    }
  }

  .content {
    background: var(--bg-primary);
    border-radius: var(--radius);
    min-height: 500px;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .error {
    padding: 2rem;
    text-align: center;
    color: var(--text-secondary);
  }

  .container.blurred {
    filter: blur(8px);
    pointer-events: none;
    user-select: none;
  }

  .password-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1002;
  }

  .password-prompt {
    background: var(--bg-primary);
    padding: 2rem;
    border-radius: 4px;
    min-width: 300px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
  }

  .password-prompt h3 {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0 0 1.5rem 0;
    text-align: center;
  }

  .password-prompt input {
    width: 100%;
    padding: 0.75rem;
    font-size: 0.875rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    color: var(--text-primary);
    margin-bottom: 1rem;
  }

  .password-prompt input:focus {
    outline: none;
    border-color: var(--text-primary);
  }

  .password-error {
    color: var(--color-danger);
    font-size: 0.875rem;
    margin-bottom: 1rem;
    text-align: center;
  }

  .password-submit {
    width: 100%;
    padding: 0.75rem;
    font-size: 0.875rem;
    font-weight: 600;
    background: var(--text-primary);
    color: var(--bg-primary);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .password-submit:hover {
    opacity: 0.9;
  }

  @media (max-width: 768px) {
    .tabs-and-view-toggle {
      flex-direction: column;
      align-items: stretch;
      gap: 0.75rem;
    }

    .view-toggle {
      align-self: flex-end;
      padding: 0.2rem;
    }

    .view-toggle-btn {
      width: 28px;
      height: 28px;
    }

    .view-toggle-btn svg {
      width: 16px;
      height: 16px;
    }

    .app-description {
      font-size: 0.7rem;
      margin: 0.25rem 0 1rem 0;
    }

    .content {
      min-height: 400px;
    }
  }

  /* Footer styles */
  .app-footer {
    margin-top: 3rem;
    padding: 1.5rem 0;
    border-top: 1px solid var(--border-color);
  }

  .footer-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .footer-item {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .footer-text {
    font-size: 0.75rem;
    color: var(--text-secondary);
    letter-spacing: 0.02em;
  }

  .footer-separator {
    font-size: 0.75rem;
    color: var(--text-secondary);
    opacity: 0.5;
  }

  .footer-link {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    color: var(--text-secondary);
    text-decoration: none;
    transition: color 0.2s ease, transform 0.2s ease;
    padding: 0.25rem;
    border-radius: 4px;
  }

  .footer-link:hover {
    color: var(--text-primary);
    transform: scale(1.05);
  }

  .footer-icon {
    width: 1.125rem;
    height: 1.125rem;
  }

  .eth-link {
    font-size: 0.75rem;
    font-weight: 500;
  }

  .eth-address {
    opacity: 0.9;
  }

  @media (max-width: 768px) {
    .app-footer {
      margin-top: 2rem;
      padding: 1rem 0;
    }

    .footer-content {
      flex-direction: column;
      gap: 0.5rem;
    }

    .footer-separator {
      display: none;
    }

    .footer-item {
      gap: 0.25rem;
    }

    .footer-text {
      font-size: 0.7rem;
    }

    .footer-icon {
      width: 1rem;
      height: 1rem;
    }

    .eth-link {
      font-size: 0.7rem;
    }
  }
</style>
