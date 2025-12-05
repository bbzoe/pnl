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

<div class="container" class:blurred={isLocked}>
  <TopBar on:openSettings={handleOpenSettings} />
  
  <p class="app-description">
    Free, private PNL tracker. All data stays local, no servers, just your trades.
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
</style>
