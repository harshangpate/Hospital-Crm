/**
 * Utility functions for critical value detection in lab tests
 */

interface RangeCheck {
  isCritical: boolean;
  reason?: string;
}

/**
 * Parse normal range string and check if result is critical
 * Supports formats like:
 * - "4.5-11.0" (simple range)
 * - "< 100" (less than)
 * - "> 10" (greater than)
 * - "70-100 mg/dL" (with units)
 */
export function checkCriticalValue(resultValue: string, normalRange: string | null): RangeCheck {
  if (!normalRange || !resultValue) {
    return { isCritical: false };
  }

  // Extract numeric value from result
  const resultNumMatch = resultValue.match(/[\d.]+/);
  if (!resultNumMatch) {
    return { isCritical: false };
  }
  
  const resultNum = parseFloat(resultNumMatch[0]);
  if (isNaN(resultNum)) {
    return { isCritical: false };
  }

  // Clean the normal range string
  const cleanRange = normalRange.trim().toLowerCase();

  // Check for "less than" format (< 100)
  const lessThanMatch = cleanRange.match(/[<]\s*([\d.]+)/);
  if (lessThanMatch) {
    const threshold = parseFloat(lessThanMatch[1]);
    if (resultNum >= threshold * 1.5) {
      return {
        isCritical: true,
        reason: `Value ${resultNum} significantly exceeds upper limit of ${threshold}`,
      };
    }
    return { isCritical: false };
  }

  // Check for "greater than" format (> 10)
  const greaterThanMatch = cleanRange.match(/[>]\s*([\d.]+)/);
  if (greaterThanMatch) {
    const threshold = parseFloat(greaterThanMatch[1]);
    if (resultNum <= threshold * 0.5) {
      return {
        isCritical: true,
        reason: `Value ${resultNum} significantly below lower limit of ${threshold}`,
      };
    }
    return { isCritical: false };
  }

  // Check for range format (4.5-11.0 or 70-100)
  const rangeMatch = cleanRange.match(/(\d+\.?\d*)\s*[-–—]\s*(\d+\.?\d*)/);
  if (rangeMatch) {
    const lowerBound = parseFloat(rangeMatch[1]);
    const upperBound = parseFloat(rangeMatch[2]);

    // Define critical thresholds (20% beyond normal range)
    const criticalLow = lowerBound * 0.8;
    const criticalHigh = upperBound * 1.2;

    if (resultNum < criticalLow) {
      return {
        isCritical: true,
        reason: `Value ${resultNum} is critically low (normal: ${lowerBound}-${upperBound})`,
      };
    }

    if (resultNum > criticalHigh) {
      return {
        isCritical: true,
        reason: `Value ${resultNum} is critically high (normal: ${lowerBound}-${upperBound})`,
      };
    }

    return { isCritical: false };
  }

  // If we can't parse the range, assume not critical
  return { isCritical: false };
}

/**
 * Check multiple test results against their normal ranges
 */
export function checkMultipleCriticalValues(
  results: Array<{ name: string; value: string; normalRange: string | null }>
): Array<{ name: string; isCritical: boolean; reason?: string }> {
  return results.map((result) => ({
    name: result.name,
    ...checkCriticalValue(result.value, result.normalRange),
  }));
}

/**
 * Common critical value thresholds for specific tests
 * These override the automatic calculation for tests with well-known critical limits
 */
const CRITICAL_THRESHOLDS: Record<
  string,
  { low?: number; high?: number; unit?: string }
> = {
  // Hematology
  'WBC': { low: 2.0, high: 30.0, unit: 'x10^9/L' },
  'Hemoglobin': { low: 7.0, high: 20.0, unit: 'g/dL' },
  'Platelets': { low: 50, high: 1000, unit: 'x10^9/L' },
  
  // Biochemistry
  'Glucose': { low: 40, high: 400, unit: 'mg/dL' },
  'Sodium': { low: 120, high: 160, unit: 'mmol/L' },
  'Potassium': { low: 2.5, high: 6.5, unit: 'mmol/L' },
  'Creatinine': { high: 5.0, unit: 'mg/dL' },
  'Calcium': { low: 6.0, high: 13.0, unit: 'mg/dL' },
  
  // Blood Gases
  'pH': { low: 7.2, high: 7.6 },
  'pO2': { low: 50, unit: 'mmHg' },
  'pCO2': { low: 20, high: 70, unit: 'mmHg' },
  
  // Cardiac
  'Troponin': { high: 0.5, unit: 'ng/mL' },
  'BNP': { high: 400, unit: 'pg/mL' },
};

/**
 * Check if a specific test has a critical value based on known thresholds
 */
export function checkKnownCriticalTest(
  testName: string,
  resultValue: string
): RangeCheck {
  const threshold = CRITICAL_THRESHOLDS[testName];
  if (!threshold) {
    return { isCritical: false };
  }

  const resultNumMatch = resultValue.match(/[\d.]+/);
  if (!resultNumMatch) {
    return { isCritical: false };
  }

  const resultNum = parseFloat(resultNumMatch[0]);
  if (isNaN(resultNum)) {
    return { isCritical: false };
  }

  if (threshold.low && resultNum < threshold.low) {
    return {
      isCritical: true,
      reason: `${testName}: ${resultNum} is critically low (threshold: ${threshold.low}${threshold.unit || ''})`,
    };
  }

  if (threshold.high && resultNum > threshold.high) {
    return {
      isCritical: true,
      reason: `${testName}: ${resultNum} is critically high (threshold: ${threshold.high}${threshold.unit || ''})`,
    };
  }

  return { isCritical: false };
}
