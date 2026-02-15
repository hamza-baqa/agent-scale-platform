import logger from '../utils/logger';

/**
 * Error Counter Service - Counts errors from validation reports
 */
class ErrorCounterService {
  /**
   * Count total errors from all validation reports
   */
  countTotalErrors(validationReports: Array<{ name: string; content: string }>): {
    totalErrors: number;
    errorsByValidator: Record<string, number>;
    errorDetails: Array<{ validator: string; errorId: string; severity: string; description: string }>;
  } {
    let totalErrors = 0;
    const errorsByValidator: Record<string, number> = {};
    const errorDetails: Array<{ validator: string; errorId: string; severity: string; description: string }> = [];

    for (const report of validationReports) {
      const errors = this.extractErrorsFromReport(report.content);
      errorsByValidator[report.name] = errors.length;
      totalErrors += errors.length;

      // Add to error details
      for (const error of errors) {
        errorDetails.push({
          validator: report.name,
          errorId: error.id,
          severity: error.severity,
          description: error.description
        });
      }
    }

    logger.info('[ERROR COUNTER] Total errors counted', {
      totalErrors,
      byValidator: errorsByValidator
    });

    return {
      totalErrors,
      errorsByValidator,
      errorDetails
    };
  }

  /**
   * Extract errors from a validation report
   * Looks for Error Report table with ERR-XXX-### format
   */
  private extractErrorsFromReport(content: string): Array<{
    id: string;
    severity: string;
    description: string;
  }> {
    const errors: Array<{ id: string; severity: string; description: string }> = [];

    // Look for error patterns like ERR-UT-001, ERR-IT-002, ERR-E2E-003
    const errorPattern = /ERR-(?:UT|IT|E2E)-\d+/g;
    const matches = content.match(errorPattern);

    if (matches) {
      // Extract unique errors (same error ID might appear multiple times)
      const uniqueErrorIds = [...new Set(matches)];

      for (const errorId of uniqueErrorIds) {
        // Try to extract severity and description from the table
        const errorLineRegex = new RegExp(`\\|\\s*${errorId}\\s*\\|\\s*(CRITICAL|HIGH|MEDIUM|LOW)\\s*\\|[^|]*\\|[^|]*\\|\\s*([^|]+)\\s*\\|`, 'i');
        const match = content.match(errorLineRegex);

        if (match) {
          errors.push({
            id: errorId,
            severity: match[1].toUpperCase(),
            description: match[2].trim()
          });
        } else {
          // If we can't extract details, just record the error ID
          errors.push({
            id: errorId,
            severity: 'UNKNOWN',
            description: 'Error details not found in report'
          });
        }
      }
    }

    // Also check for summary line like "Total Errors: 15"
    const summaryPattern = /Total\s+Errors?:\s*(\d+)/i;
    const summaryMatch = content.match(summaryPattern);

    if (summaryMatch && errors.length === 0) {
      // If we found a summary but no individual errors, create placeholder entries
      const errorCount = parseInt(summaryMatch[1], 10);
      for (let i = 0; i < errorCount; i++) {
        errors.push({
          id: `ERROR-${i + 1}`,
          severity: 'UNKNOWN',
          description: 'Error identified in validation summary'
        });
      }
    }

    return errors;
  }

  /**
   * Check if we've achieved zero errors (success condition)
   */
  hasZeroErrors(errorCount: { totalErrors: number }): boolean {
    return errorCount.totalErrors === 0;
  }

  /**
   * Calculate errors fixed between attempts
   */
  calculateErrorsFixed(previousCount: number, currentCount: number): number {
    return Math.max(0, previousCount - currentCount);
  }
}

export default new ErrorCounterService();
