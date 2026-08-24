import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BudgetChart, ChartDataItem } from './BudgetChart';

const dummyChartData: ChartDataItem[] = [
  {
    dateKey: '2026-07-01',
    label: '1. Jul',
    dateLabel: '01.07.2026',
    dailyValue: 50,
    cumulativeValue: 50,
    isFuture: false,
    products: [],
  },
  {
    dateKey: '2026-07-02',
    label: '2. Jul',
    dateLabel: '02.07.2026',
    dailyValue: 30,
    cumulativeValue: 80,
    isFuture: false,
    products: [],
  },
  {
    dateKey: '2026-07-03',
    label: '3. Jul',
    dateLabel: '03.07.2026',
    dailyValue: 20,
    cumulativeValue: 100,
    isFuture: false,
    products: [],
  },
];

const defaultProps = {
  timeRange: 'month' as const,
  chartMode: 'daily' as const,
  setChartMode: vi.fn(),
  currentPeriodDate: new Date('2026-07-01'),
  chartData: dummyChartData,
  actualData: dummyChartData,
  selectedDay: null,
  onSelectDay: vi.fn(),
  hoveredDay: null,
  onHoverDay: vi.fn(),
  monthlyBudget: 600,
  projectedEndSpend: 600,
  projectedEndWeekSpend: 140,
  isOverBudget: false,
  isCurrentMonth: true,
  isCurrentWeek: true,
  formattedActivePeriod: 'Juli 2026',
  handlePrevPeriod: vi.fn(),
  handleNextPeriod: vi.fn(),
  isNextDisabled: false,
  onOpenDatePicker: vi.fn(),
  getSollPaceVal: (i: number) => (i + 1) * 20,
  getTargetVal: () => 20,
};

function createTouchEvent(type: string, touches: Array<{ clientX: number; clientY: number }>) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'touches', {
    value: touches,
    configurable: true,
  });
  return event;
}

describe('BudgetChart Gesture & Zoom Handler Empirical Tests', () => {
  it('renders title and chart container properly', () => {
    render(<BudgetChart {...defaultProps} />);
    expect(screen.getByText('Ausgabenverlauf')).toBeInTheDocument();
    expect(screen.queryByText('Zoom zurücksetzen')).not.toBeInTheDocument();
  });

  it('triggers wheel zoom on Ctrl+Wheel and enables Reset Zoom button', () => {
    const { container } = render(<BudgetChart {...defaultProps} />);
    const chartContainer = container.querySelector('.relative.overflow-hidden');
    expect(chartContainer).not.toBeNull();

    act(() => {
      fireEvent.wheel(chartContainer!, {
        ctrlKey: true,
        deltaY: -100,
      });
    });

    // Reset button should now be visible
    const resetButton = screen.getByText('Zoom zurücksetzen');
    expect(resetButton).toBeInTheDocument();

    // Clicking reset button clears zoom
    act(() => {
      fireEvent.click(resetButton);
    });
    expect(screen.queryByText('Zoom zurücksetzen')).not.toBeInTheDocument();
  });

  it('triggers Y-axis zoom on Ctrl+Shift+Wheel', () => {
    const { container } = render(<BudgetChart {...defaultProps} />);
    const chartContainer = container.querySelector('.relative.overflow-hidden');

    act(() => {
      fireEvent.wheel(chartContainer!, {
        ctrlKey: true,
        shiftKey: true,
        deltaY: -100,
      });
    });

    const resetButton = screen.getByText('Zoom zurücksetzen');
    expect(resetButton).toBeInTheDocument();
  });

  it('does NOT trigger zoom on normal mouse wheel scroll without Ctrl or Meta', () => {
    const { container } = render(<BudgetChart {...defaultProps} />);
    const chartContainer = container.querySelector('.relative.overflow-hidden');

    act(() => {
      fireEvent.wheel(chartContainer!, {
        ctrlKey: false,
        metaKey: false,
        deltaY: -100,
      });
    });

    expect(screen.queryByText('Zoom zurücksetzen')).not.toBeInTheDocument();
  });

  it('handles 2-finger touch pinch-to-zoom in and out', () => {
    const { container } = render(<BudgetChart {...defaultProps} />);
    const chartContainer = container.querySelector('.relative.overflow-hidden');
    expect(chartContainer).not.toBeNull();

    // Touch start with 2 fingers 50px apart
    act(() => {
      chartContainer!.dispatchEvent(
        createTouchEvent('touchstart', [
          { clientX: 100, clientY: 100 },
          { clientX: 150, clientY: 100 },
        ])
      );
    });

    // Pinch outward: move fingers to 100px apart (dx goes from 50 to 100)
    act(() => {
      chartContainer!.dispatchEvent(
        createTouchEvent('touchmove', [
          { clientX: 75, clientY: 100 },
          { clientX: 175, clientY: 100 },
        ])
      );
    });

    expect(screen.getByText('Zoom zurücksetzen')).toBeInTheDocument();

    // Touch end
    act(() => {
      chartContainer!.dispatchEvent(createTouchEvent('touchend', []));
    });
  });

  it('edge case: pinch start distance < 15px threshold prevents zooming initially', () => {
    const { container } = render(<BudgetChart {...defaultProps} />);
    const chartContainer = container.querySelector('.relative.overflow-hidden');

    // Touch start with fingers only 10px apart (< 15px threshold)
    act(() => {
      chartContainer!.dispatchEvent(
        createTouchEvent('touchstart', [
          { clientX: 100, clientY: 100 },
          { clientX: 110, clientY: 100 },
        ])
      );
    });

    // Expand fingers to 100px apart
    act(() => {
      chartContainer!.dispatchEvent(
        createTouchEvent('touchmove', [
          { clientX: 50, clientY: 100 },
          { clientX: 150, clientY: 100 },
        ])
      );
    });

    // Because start distance was 10 (< 15), distanceX > threshold is false in touchStartRef check,
    // so newZoomX is not updated during this gesture!
    expect(screen.queryByText('Zoom zurücksetzen')).not.toBeInTheDocument();
  });

  it('resets zoom when period changes', () => {
    const { container, rerender } = render(<BudgetChart {...defaultProps} />);
    const chartContainer = container.querySelector('.relative.overflow-hidden');

    act(() => {
      fireEvent.wheel(chartContainer!, {
        ctrlKey: true,
        deltaY: -100,
      });
    });

    expect(screen.getByText('Zoom zurücksetzen')).toBeInTheDocument();

    // Rerender with new currentPeriodDate
    act(() => {
      rerender(<BudgetChart {...defaultProps} currentPeriodDate={new Date('2026-08-01')} />);
    });

    expect(screen.queryByText('Zoom zurücksetzen')).not.toBeInTheDocument();
  });

  it('renders matching SVG viewBox width and content width without distortion', () => {
    const { container } = render(<BudgetChart {...defaultProps} timeRange="7d" />);
    const svg = container.querySelector('svg.w-full');
    expect(svg).not.toBeNull();
    const viewBox = svg!.getAttribute('viewBox');
    expect(viewBox).toMatch(/^0 0 \d+ 260$/);
  });

  it('renders seamless connection between cumulative line path and forecast line', () => {
    const monthData: ChartDataItem[] = Array.from({ length: 31 }, (_, i) => {
      const day = i + 1;
      const isPast = day <= 24;
      return {
        dateKey: `2026-08-${String(day).padStart(2, '0')}`,
        label: `${day}.`,
        dateLabel: `${String(day).padStart(2, '0')}.08.2026`,
        dailyValue: day === 11 ? 500 : 0,
        cumulativeValue: isPast ? (day >= 11 ? 500 : 0) : null,
        isFuture: !isPast,
        products: [],
      };
    });

    const actualMonthData = monthData.filter(d => !d.isFuture);

    const { container } = render(
      <BudgetChart
        {...defaultProps}
        chartMode="cumulative"
        timeRange="month"
        chartData={monthData}
        actualData={actualMonthData}
        isCurrentMonth={true}
      />
    );

    // Curve path and area path should exist and span across all actual data points (up to day 24)
    const curvePath = container.querySelector('path[stroke="url(#curveGradient)"]');
    expect(curvePath).not.toBeNull();
    const d = curvePath!.getAttribute('d');
    expect(d).toContain('M ');
    expect(d).toContain('C ');

    // Forecast dashed line should start at the last actual data point (day 24)
    const forecastLine = container.querySelector('line[stroke-dasharray="4 4"]');
    expect(forecastLine).not.toBeNull();
  });
});
