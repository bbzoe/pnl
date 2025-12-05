<script lang="ts">
  import { startOfYear, startOfMonth, startOfWeek, subYears, subMonths, subWeeks, subDays, parseISO, startOfDay, endOfDay } from 'date-fns';
  import { settings } from '../stores';
  import type { DayData } from '../types';

  export let data: DayData = {};

  // Calculate PnL for different time periods
  function calculatePnL(startDate: Date, endDate: Date = new Date()): number {
    let sum = 0;
    const start = startOfDay(startDate);
    const end = endOfDay(endDate);
    
    for (const [dateStr, value] of Object.entries(data)) {
      try {
        const date = parseISO(dateStr);
        if (isNaN(date.getTime())) continue;
        
        const dayStart = startOfDay(date);
        // Check if date is within range (inclusive)
        if (dayStart >= start && dayStart <= end) {
          sum += value;
        }
      } catch {
        // Skip invalid dates
        continue;
      }
    }
    return sum;
  }

  let allTimePnL = 0;
  let lastYearPnL = 0;
  let thisYearPnL = 0;
  let lastMonthPnL = 0;
  let thisMonthPnL = 0;
  let lastWeekPnL = 0;
  let thisWeekPnL = 0;

  // Make calculations reactive to data changes
  // Use explicit data dependency to ensure reactivity
  function updateCalculations() {
    const now = new Date();
    const today = startOfDay(now);
    const yesterday = endOfDay(subDays(today, 1));
    
    // All time: from beginning to today
    allTimePnL = calculatePnL(new Date(0), today);
    
    // Last year: from same date one year ago to yesterday (inclusive)
    const oneYearAgo = startOfDay(subYears(now, 1));
    lastYearPnL = calculatePnL(oneYearAgo, yesterday);
    
    // This year: from start of current calendar year to today
    const thisYearStart = startOfDay(startOfYear(now));
    thisYearPnL = calculatePnL(thisYearStart, today);
    
    // Last month: last 30 days to yesterday (inclusive)
    const oneMonthAgo = startOfDay(subMonths(now, 1));
    lastMonthPnL = calculatePnL(oneMonthAgo, yesterday);
    
    // This month: from start of current calendar month to today
    const thisMonthStart = startOfDay(startOfMonth(now));
    thisMonthPnL = calculatePnL(thisMonthStart, today);
    
    // Last week: last 7 days to yesterday (inclusive)
    const oneWeekAgo = startOfDay(subWeeks(now, 1));
    lastWeekPnL = calculatePnL(oneWeekAgo, yesterday);
    
    // This week: from start of current week (Monday) to today
    const thisWeekStart = startOfDay(startOfWeek(now, { weekStartsOn: 1 }));
    thisWeekPnL = calculatePnL(thisWeekStart, today);
  }

  // Reactive statement: recalculate when data changes
  // Use JSON.stringify to detect any changes in the data object
  $: JSON.stringify(data), updateCalculations();

  function formatValue(val: number): string {
    if (val === 0) return '0';
    const absVal = Math.abs(val);
    let formatted: string;
    if (absVal >= 1000000) {
      formatted = (val / 1000000).toFixed(2) + 'M';
    } else if (absVal >= 1000) {
      formatted = (val / 1000).toFixed(2) + 'K';
    } else if (Number.isInteger(val)) {
      formatted = val.toString();
    } else {
      formatted = val.toFixed(2);
    }
    // Add + sign for positive values
    return val > 0 ? `+${formatted}` : formatted;
  }

  function getValueClass(val: number): string {
    if (val > 0) return 'positive';
    if (val < 0) return 'negative';
    return 'neutral';
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
</script>

<div class="stats-widgets">
  {#if widgetVisibility.allTime}
    <div class="widget">
      <div class="widget-label">All time PnL</div>
      <div class="widget-value {getValueClass(allTimePnL)}">
        {formatValue(allTimePnL)} <span class="currency">{$settings.currency}</span>
      </div>
    </div>
  {/if}

  {#if widgetVisibility.lastYear}
    <div class="widget">
      <div class="widget-label">Last year PnL</div>
      <div class="widget-value {getValueClass(lastYearPnL)}">
        {formatValue(lastYearPnL)} <span class="currency">{$settings.currency}</span>
      </div>
    </div>
  {/if}

  {#if widgetVisibility.thisYear}
    <div class="widget">
      <div class="widget-label">This year PnL</div>
      <div class="widget-value {getValueClass(thisYearPnL)}">
        {formatValue(thisYearPnL)} <span class="currency">{$settings.currency}</span>
      </div>
    </div>
  {/if}

  {#if widgetVisibility.lastMonth}
    <div class="widget">
      <div class="widget-label">Last month PnL</div>
      <div class="widget-value {getValueClass(lastMonthPnL)}">
        {formatValue(lastMonthPnL)} <span class="currency">{$settings.currency}</span>
      </div>
    </div>
  {/if}

  {#if widgetVisibility.thisMonth}
    <div class="widget">
      <div class="widget-label">This month PnL</div>
      <div class="widget-value {getValueClass(thisMonthPnL)}">
        {formatValue(thisMonthPnL)} <span class="currency">{$settings.currency}</span>
      </div>
    </div>
  {/if}

  {#if widgetVisibility.lastWeek}
    <div class="widget">
      <div class="widget-label">Last week PnL</div>
      <div class="widget-value {getValueClass(lastWeekPnL)}">
        {formatValue(lastWeekPnL)} <span class="currency">{$settings.currency}</span>
      </div>
    </div>
  {/if}

  {#if widgetVisibility.thisWeek}
    <div class="widget">
      <div class="widget-label">This week PnL</div>
      <div class="widget-value {getValueClass(thisWeekPnL)}">
        {formatValue(thisWeekPnL)} <span class="currency">{$settings.currency}</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .stats-widgets {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .widget {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 1.25rem;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  :global(.dark) .widget {
    background: var(--bg-primary);
    border-color: #3f3f46; /* Zinc 700 - lighter border in dark mode */
  }

  .widget:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .widget-label {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.75rem;
  }

  .widget-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
  }

  .widget-value.positive {
    color: var(--color-success);
  }

  .widget-value.negative {
    color: var(--color-danger);
  }

  .widget-value.neutral {
    color: var(--text-secondary);
  }

  .currency {
    font-size: 0.875rem;
    font-weight: 400;
    opacity: 0.7;
  }

  @media (max-width: 768px) {
    .stats-widgets {
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }

    .widget {
      padding: 1rem;
    }

    .widget-value {
      font-size: 1.25rem;
    }
  }

  @media (max-width: 480px) {
    .stats-widgets {
      grid-template-columns: 1fr;
    }
  }
</style>

