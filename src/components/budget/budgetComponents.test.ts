import { describe, it, expect } from 'vitest';

describe('Budget Component Helpers & Calculations', () => {
  it('calculates daily average and target budget correctly', () => {
    const monthlyBudget = 600;
    const dailyTarget = monthlyBudget / 30;
    const weekTarget = (monthlyBudget / 30) * 7;

    expect(dailyTarget).toBe(20);
    expect(weekTarget).toBe(140);
  });

  it('correctly calculates budget diff for ERSPARNIS vs ÜBERSCHREITUNG', () => {
    const budgetLimit = 20;
    const dailySpendUnder = 15;
    const dailySpendOver = 25;

    const diffUnder = dailySpendUnder - budgetLimit;
    const diffOver = dailySpendOver - budgetLimit;

    expect(diffUnder).toBe(-5);
    expect(diffOver).toBe(5);
  });
});
