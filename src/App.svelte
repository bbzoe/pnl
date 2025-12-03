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

  let activeTab = 'main';

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
  $: currentData = isMain 
    ? $mainCalendarData // derived store value
    : (activeCalendar?.data || {});
  
  $: isReadOnly = isAggregate; 
</script>

<div class="container">
  <TopBar />
  
  <Tabs 
    calendars={$calendars} 
    activeId={activeTab} 
    on:select={handleSelect}
    on:add={handleAdd}
    on:remove={handleRemove}
    on:rename={handleRename}
  />

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
        <CalendarView 
          calendarId={activeTab}
          data={currentData}
          isReadOnly={isReadOnly}
        />
      {/key}
    {:else}
      <div class="error">Calendar not found</div>
    {/if}
  </main>
</div>

<style>
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
</style>
