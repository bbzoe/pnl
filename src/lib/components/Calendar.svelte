<script lang="ts">
  import { 
    startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, 
    format, addMonths, subMonths, isToday, isSameMonth, parseISO
  } from 'date-fns';
  import { updateCell } from '../stores';
  import DayCell from './DayCell.svelte';
  import type { DayData } from '../types';

  export let calendarId: string;
  export let data: DayData;
  export let isReadOnly: boolean = false;
  
  let currentDate = new Date();

  $: monthStart = startOfMonth(currentDate);
  $: monthEnd = endOfMonth(currentDate);
  $: startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  $: endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  $: days = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  $: weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  function nextMonth() {
    currentDate = addMonths(currentDate, 1);
  }

  function prevMonth() {
    currentDate = subMonths(currentDate, 1);
  }
  
  function handleCellChange(date: Date, event: CustomEvent) {
    if (isReadOnly) return;
    const dateStr = format(date, 'yyyy-MM-dd');
    updateCell(calendarId, dateStr, event.detail.value);
  }

  // Calculate intensity for color scaling
  $: visibleValues = days.map(day => {
      const d = format(day, 'yyyy-MM-dd');
      return data[d];
  }).filter(v => v !== undefined && v !== null);

  $: maxPositive = Math.max(0, ...visibleValues.filter(v => v > 0));
  $: minNegative = Math.min(0, ...visibleValues.filter(v => v < 0));
</script>

<div class="calendar-container">
  <div class="calendar-header">
    <button on:click={prevMonth} class="nav-btn">
      &larr;
    </button>
    <h2 class="month-label">
      {format(currentDate, 'MMMM yyyy')}
    </h2>
    <button on:click={nextMonth} class="nav-btn">
      &rarr;
    </button>
  </div>

  <div class="weekdays-grid">
    {#each weekDays as day}
      <div class="weekday">{day}</div>
    {/each}
  </div>

  <div class="days-grid">
    {#each days as day}
      {@const dateStr = format(day, 'yyyy-MM-dd')}
      {@const val = data[dateStr]}
      <DayCell 
        dateLabel={format(day, 'd')}
        value={val}
        maxPositive={maxPositive}
        minNegative={minNegative}
        isReadOnly={isReadOnly}
        isToday={isToday(day)}
        isOutsideMonth={!isSameMonth(day, currentDate)}
        on:change={(e) => handleCellChange(day, e)}
      />
    {/each}
  </div>
</div>

<style>
  .calendar-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    height: 100%;
  }

  .calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 0.5rem;
  }

  .month-label {
    font-size: 1.5rem;
    font-weight: 700;
    text-transform: capitalize;
  }

  .nav-btn {
    font-size: 1.5rem;
    padding: 0.5rem 1rem;
    border-radius: var(--radius);
    color: var(--text-secondary);
    transition: all 0.2s;
  }
  .nav-btn:hover {
    background-color: var(--bg-tertiary);
    color: var(--text-primary);
  }

  .weekdays-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 0.5rem;
    text-align: center;
    margin-bottom: 0.5rem;
  }

  .weekday {
    font-weight: 600;
    color: var(--text-secondary);
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .days-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 0.5rem;
    /* Auto rows */
  }
  
  @media (max-width: 768px) {
    .days-grid {
      gap: 0.25rem;
    }
  }
</style>

