import { validateStartCommand } from '../../validators/start';

describe('Start Command Validator', () => {
  describe('valid inputs', () => {
    it('should accept valid start command with proper parameters', () => {
      const result = validateStartCommand('/start 1 hour');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should accept start command with different time units', () => {
      const validInputs = [
        '/start 30 minutes',
        '/start 2 hours',
        '/start 1 day',
        '/start 1 week',
        '/start 15 mins',
        '/start 3 hrs'
      ];

      validInputs.forEach(input => {
        const result = validateStartCommand(input);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeNull();
      });
    });

    it('should handle multiple digit time values', () => {
      const result = validateStartCommand('/start 123 hours');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  describe('invalid inputs', () => {
    it('should reject empty input', () => {
      const result = validateStartCommand('');
      expect(result.isValid).toBe(false);
      expect(result.error).not.toBeNull();
    });

    it('should reject null input', () => {
      const result = validateStartCommand(null as any);
      expect(result.isValid).toBe(false);
      expect(result.error).not.toBeNull();
    });

    it('should reject undefined input', () => {
      const result = validateStartCommand(undefined as any);
      expect(result.isValid).toBe(false);
      expect(result.error).not.toBeNull();
    });

    it('should reject input without proper command format', () => {
      const invalidInputs = [
        'start 1 hour',
        '/start',
        '/start 1',
        '/start hour',
        '/begin 1 hour',
        '1 hour',
        '/start 1 hour extra'
      ];

      invalidInputs.forEach(input => {
        const result = validateStartCommand(input);
        expect(result.isValid).toBe(false);
        expect(result.error).not.toBeNull();
      });
    });

    it('should reject invalid time units', () => {
      const invalidInputs = [
        '/start 1 month',
        '/start 1 year',
        '/start 1 century',
        '/start 1 seconds',
        '/start 1 sec',
        '/start 1 fortnight'
      ];

      invalidInputs.forEach(input => {
        const result = validateStartCommand(input);
        expect(result.isValid).toBe(false);
        expect(result.error).not.toBeNull();
      });
    });

    it('should reject non-numeric time values', () => {
      const invalidInputs = [
        '/start one hour',
        '/start abc hours',
        '/start !@#$ hours',
        '/start -1 hour',
        '/start 0 hour',
        '/start 0.5 hour'
      ];

      invalidInputs.forEach(input => {
        const result = validateStartCommand(input);
        expect(result.isValid).toBe(false);
        expect(result.error).not.toBeNull();
      });
    });

    it('should reject special characters in input', () => {
      const invalidInputs = [
        '/start 1 hour<script>alert("xss")</script>',
        '/start 1 hour && rm -rf /',
        '/start 1 hour; rm -rf /',
        '/start 1 hour | cat /etc/passwd',
        '/start 1 hour`rm -rf /`',
        '/start 1 hour" onload="alert(1)',
        '/start 1 hour' || 'true'
      ];

      invalidInputs.forEach(input => {
        const result = validateStartCommand(input);
        expect(result.isValid).toBe(false);
        expect(result.error).not.toBeNull();
      });
    });

    it('should reject overly long input', () => {
      const longInput = `/start ${'1'.repeat(1000)} hours`;
      const result = validateStartCommand(longInput);
      expect(result.isValid).toBe(false);
      expect(result.error).not.toBeNull();
    });

    it('should reject input with excessive whitespace', () => {
      const invalidInputs = [
        '/start   1   hour', // Multiple spaces
        '/start	1	hour', // Tab characters
        '/start\n1\nhour', // Newline characters
        '/start  1  hour  extra  ', // Trailing and internal spaces
      ];

      invalidInputs.forEach(input => {
        const result = validateStartCommand(input);
        expect(result.isValid).toBe(false);
        expect(result.error).not.toBeNull();
      });
    });

    it('should reject commands with extra parameters', () => {
      const invalidInputs = [
        '/start 1 hour extra',
        '/start 1 hour param1 param2',
        '/start 1 hour --flag',
        '/start 1 hour & echo "test"',
        '/start 1 hour # comment'
      ];

      invalidInputs.forEach(input => {
        const result = validateStartCommand(input);
        expect(result.isValid).toBe(false);
        expect(result.error).not.toBeNull();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle unicode characters properly', () => {
      const invalidInputs = [
        '/start 1 hоur', // Cyrillic 'o'
        '/start 1 hоurs', // Mixed script
        '/start 1 час', // Non-Latin time unit
        '/start ١ hour', // Arabic numerals
      ];

      invalidInputs.forEach(input => {
        const result = validateStartCommand(input);
        expect(result.isValid).toBe(false);
        expect(result.error).not.toBeNull();
      });
    });

    it('should handle mixed case properly', () => {
      const result = validateStartCommand('/START 1 HOUR');
      expect(result.isValid).toBe(false); // Case sensitive
      expect(result.error).not.toBeNull();
    });

    it('should handle boundary numeric values', () => {
      const validResult = validateStartCommand('/start 1 hour');
      expect(validResult.isValid).toBe(true);

      const invalidResult = validateStartCommand('/start 0 hour');
      expect(invalidResult.isValid).toBe(false);
    });
  });
});
