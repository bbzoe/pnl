<script lang="ts">
  import type { DayData } from '../types';
  import { parseISO, format, startOfDay, endOfDay, eachDayOfInterval, isWithinInterval } from 'date-fns';

  export let data: DayData = {};

  // Get all dates from data and sort them
  $: dates = Object.keys(data)
    .map(d => {
      try {
        return parseISO(d);
      } catch {
        return null;
      }
    })
    .filter((d): d is Date => d !== null && !isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  $: dailyValues = dates.map(d => {
    const dateStr = format(d, 'yyyy-MM-dd');
    return data[dateStr] || 0;
  });

  // Calculate cumulative values (running total)
  $: cumulativeValues = dailyValues.reduce((acc, val, idx) => {
    const prev = idx > 0 ? acc[idx - 1] : 0;
    acc.push(prev + val);
    return acc;
  }, [] as number[]);

  // Chart dimensions
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartWidth = 800;
  const chartHeight = 400;
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  $: maxValue = Math.max(...cumulativeValues, 0);
  $: minValue = Math.min(...cumulativeValues, 0);
  $: valueRange = maxValue - minValue || 1;

  // Scale functions
  $: scaleX = (index: number) => {
    if (dates.length <= 1) return padding.left;
    return padding.left + (index / (dates.length - 1)) * innerWidth;
  };

  $: scaleY = (value: number) => {
    if (valueRange === 0) return padding.top + innerHeight / 2;
    // Zero line at center, positive values go up, negative go down
    const zeroY = padding.top + innerHeight / 2;
    if (minValue >= 0) {
      // All positive values - zero at bottom, max at top
      const normalized = maxValue > 0 ? value / maxValue : 0;
      return padding.top + innerHeight - (normalized * innerHeight);
    } else if (maxValue <= 0) {
      // All negative values - zero at top, min at bottom
      const normalized = minValue < 0 ? Math.abs(value) / Math.abs(minValue) : 0;
      return padding.top + (normalized * innerHeight);
    } else {
      // Mixed positive and negative - zero in center
      const maxAbs = Math.max(Math.abs(maxValue), Math.abs(minValue));
      const normalized = value / maxAbs;
      return zeroY - (normalized * (innerHeight / 2));
    }
  };

  // Zero line Y position
  $: zeroY = padding.top + innerHeight / 2;
  
  // Format value for Y-axis labels
  function formatYValue(val: number): string {
    const absVal = Math.abs(val);
    if (absVal >= 1000) {
      const kValue = val / 1000;
      // Remove trailing .0
      if (kValue % 1 === 0) {
        return kValue.toFixed(0) + 'K';
      }
      return kValue.toFixed(1) + 'K';
    }
    return val.toFixed(0);
  }

  // Generate path for line (using cumulative values)
  $: linePath = (() => {
    if (cumulativeValues.length === 0) return '';
    if (cumulativeValues.length === 1) {
      const x = scaleX(0);
      const y = scaleY(cumulativeValues[0]);
      return `M ${x} ${y}`;
    }
    return cumulativeValues
      .map((val, idx) => {
        const x = scaleX(idx);
        const y = scaleY(val);
        return idx === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      })
      .join(' ');
  })();

  // Generate area path (shaded area under line)
  $: areaPath = (() => {
    if (cumulativeValues.length === 0) return '';
    const firstX = scaleX(0);
    const lastX = scaleX(cumulativeValues.length - 1);
    const zeroYPos = scaleY(0);
    
    const linePoints = cumulativeValues
      .map((val, idx) => {
        const x = scaleX(idx);
        const y = scaleY(val);
        return `${x},${y}`;
      })
      .join(' ');
    
    return `M ${firstX} ${zeroYPos} L ${linePoints} L ${lastX} ${zeroYPos} Z`;
  })();

  // Split line into segments by sign (for color changes)
  $: lineSegments = (() => {
    if (cumulativeValues.length === 0) return [];
    const segments: Array<{ path: string; color: string }> = [];
    
    let segmentStart = 0;
    let currentSign: 'positive' | 'negative' | null = null;
    
    for (let idx = 0; idx < cumulativeValues.length; idx++) {
      const val = cumulativeValues[idx];
      const sign = val >= 0 ? 'positive' : 'negative';
      
      if (currentSign === null) {
        currentSign = sign;
      } else if (currentSign !== sign) {
        // Sign changed - create segment for previous range
        let path = `M ${scaleX(segmentStart)} ${scaleY(cumulativeValues[segmentStart])}`;
        for (let i = segmentStart + 1; i < idx; i++) {
          path += ` L ${scaleX(i)} ${scaleY(cumulativeValues[i])}`;
        }
        // Add point at current index (where sign changed)
        path += ` L ${scaleX(idx)} ${scaleY(val)}`;
        
        segments.push({
          path,
          color: currentSign === 'positive' ? 'var(--color-success)' : 'var(--color-danger)'
        });
        
        segmentStart = idx;
        currentSign = sign;
      }
    }
    
    // Add last segment
    if (segmentStart < cumulativeValues.length && currentSign !== null) {
      let path = `M ${scaleX(segmentStart)} ${scaleY(cumulativeValues[segmentStart])}`;
      for (let i = segmentStart + 1; i < cumulativeValues.length; i++) {
        path += ` L ${scaleX(i)} ${scaleY(cumulativeValues[i])}`;
      }
      
      segments.push({
        path,
        color: currentSign === 'positive' ? 'var(--color-success)' : 'var(--color-danger)'
      });
    }
    
    return segments;
  })();

  // Create area segments: green above zero line, red below zero line
  $: areaSegments = (() => {
    if (cumulativeValues.length === 0) return [];
    const segments: Array<{ path: string; color: string }> = [];
    const zeroYPos = scaleY(0);
    
    // Helper function to calculate intersection with zero line
    function findZeroIntersection(idx1: number, idx2: number): { x: number; y: number } | null {
      const val1 = cumulativeValues[idx1];
      const val2 = cumulativeValues[idx2];
      
      // If both have same sign, no intersection
      if ((val1 >= 0 && val2 >= 0) || (val1 < 0 && val2 < 0)) {
        return null;
      }
      
      // Calculate intersection point
      const t = val1 !== val2 ? -val1 / (val2 - val1) : 0;
      const x1 = scaleX(idx1);
      const x2 = scaleX(idx2);
      const intersectX = x1 + (x2 - x1) * t;
      
      return { x: intersectX, y: zeroYPos };
    }
    
    // Process each interval between consecutive points
    for (let idx = 0; idx < cumulativeValues.length - 1; idx++) {
      const val1 = cumulativeValues[idx];
      const val2 = cumulativeValues[idx + 1];
      const x1 = scaleX(idx);
      const x2 = scaleX(idx + 1);
      const y1 = scaleY(val1);
      const y2 = scaleY(val2);
      
      const intersection = findZeroIntersection(idx, idx + 1);
      
      if (intersection) {
        // Line crosses zero - create two segments
        // First segment: from point 1 to intersection
        if (val1 >= 0) {
          // Green area above zero
          const path1 = `M ${x1} ${y1} L ${intersection.x} ${intersection.y} L ${intersection.x} ${zeroYPos} L ${x1} ${zeroYPos} Z`;
          segments.push({ path: path1, color: 'var(--color-success)' });
        } else {
          // Red area below zero
          const path1 = `M ${x1} ${y1} L ${intersection.x} ${intersection.y} L ${intersection.x} ${zeroYPos} L ${x1} ${zeroYPos} Z`;
          segments.push({ path: path1, color: 'var(--color-danger)' });
        }
        
        // Second segment: from intersection to point 2
        if (val2 >= 0) {
          // Green area above zero
          const path2 = `M ${intersection.x} ${intersection.y} L ${x2} ${y2} L ${x2} ${zeroYPos} L ${intersection.x} ${zeroYPos} Z`;
          segments.push({ path: path2, color: 'var(--color-success)' });
        } else {
          // Red area below zero
          const path2 = `M ${intersection.x} ${intersection.y} L ${x2} ${y2} L ${x2} ${zeroYPos} L ${intersection.x} ${zeroYPos} Z`;
          segments.push({ path: path2, color: 'var(--color-danger)' });
        }
      } else {
        // No intersection - both points on same side of zero
        if (val1 >= 0 && val2 >= 0) {
          // Green area above zero
          const path = `M ${x1} ${y1} L ${x2} ${y2} L ${x2} ${zeroYPos} L ${x1} ${zeroYPos} Z`;
          segments.push({ path, color: 'var(--color-success)' });
        } else if (val1 < 0 && val2 < 0) {
          // Red area below zero
          const path = `M ${x1} ${y1} L ${x2} ${y2} L ${x2} ${zeroYPos} L ${x1} ${zeroYPos} Z`;
          segments.push({ path, color: 'var(--color-danger)' });
        }
      }
    }
    
    return segments;
  })();
</script>

<div class="chart-container">
  {#if dates.length === 0}
    <div class="empty-state">
      <p>No data to display</p>
    </div>
  {:else}
    <svg class="chart" viewBox="0 0 {chartWidth} {chartHeight}" preserveAspectRatio="xMidYMid meet">
      <!-- Grid lines -->
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border-color)" stroke-width="0.5" opacity="0.3"/>
        </pattern>
      </defs>
      <rect width={chartWidth} height={chartHeight} fill="url(#grid)" />

      <!-- Zero line -->
      <line
        x1={padding.left}
        y1={zeroY}
        x2={chartWidth - padding.right}
        y2={zeroY}
        stroke="var(--text-secondary)"
        stroke-width="1"
        stroke-dasharray="4,4"
        opacity="0.5"
      />

      <!-- Shaded areas under line -->
      {#each areaSegments as segment}
        <path
          d={segment.path}
          fill={segment.color}
          opacity="0.25"
        />
      {/each}

      <!-- Line segments with different colors -->
      {#each lineSegments as segment}
        <path
          d={segment.path}
          fill="none"
          stroke={segment.color}
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      {/each}

      <!-- Points on line -->
      {#each cumulativeValues as val, idx}
        <circle
          cx={scaleX(idx)}
          cy={scaleY(val)}
          r="3.5"
          fill={val >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}
          stroke="var(--bg-primary)"
          stroke-width="1.5"
        />
      {/each}

      <!-- X-axis labels -->
      {#each dates as date, idx}
        {@const x = scaleX(idx)}
        {#if idx % Math.ceil(dates.length / 8) === 0 || idx === dates.length - 1}
          <text
            x={x}
            y={chartHeight - padding.bottom + 20}
            text-anchor="middle"
            fill="var(--text-secondary)"
            font-size="10"
          >
            {format(date, 'MMM d')}
          </text>
        {/if}
      {/each}

      <!-- Y-axis labels -->
      {#each (() => {
        const labels: number[] = [];
        const range = maxValue - minValue;
        
        if (range === 0) {
          labels.push(minValue);
        } else if (minValue < 0 && maxValue > 0) {
          // Mixed: show min, 0, max, and maybe one intermediate value each side
          labels.push(minValue);
          if (Math.abs(minValue) > 500) {
            const midNeg = Math.round(minValue / 2 / 500) * 500;
            if (midNeg < 0 && Math.abs(midNeg - minValue) > 100) labels.push(midNeg);
          }
          labels.push(0);
          if (maxValue > 500) {
            const midPos = Math.round(maxValue / 2 / 500) * 500;
            if (midPos > 0 && Math.abs(midPos - maxValue) > 100) labels.push(midPos);
          }
          labels.push(maxValue);
        } else if (minValue >= 0) {
          // All positive
          labels.push(0);
          if (maxValue > 1000) {
            const mid = Math.round(maxValue / 2 / 500) * 500;
            if (mid > 0 && mid !== maxValue) labels.push(mid);
          }
          labels.push(maxValue);
        } else {
          // All negative
          labels.push(minValue);
          if (Math.abs(minValue) > 1000) {
            const mid = Math.round(minValue / 2 / 500) * 500;
            if (mid < 0 && mid !== minValue) labels.push(mid);
          }
          labels.push(0);
        }
        return labels.filter((v, i, arr) => arr.indexOf(v) === i).sort((a, b) => a - b);
      })() as val}
        {#if val !== undefined && !isNaN(val)}
          <text
            x={padding.left - 10}
            y={scaleY(val) + 4}
            text-anchor="end"
            fill="var(--text-secondary)"
            font-size="11"
            font-weight="500"
          >
            {formatYValue(val)}
          </text>
        {/if}
      {/each}
    </svg>
  {/if}
</div>

<style>
  .chart-container {
    width: 100%;
    height: 100%;
    min-height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .chart {
    width: 100%;
    height: 100%;
    max-height: 500px;
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-secondary);
    font-size: 0.875rem;
  }
</style>

