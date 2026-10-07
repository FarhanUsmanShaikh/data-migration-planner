import { TransformationEngine } from '@/lib/transformations/engine';

describe('TransformationEngine', () => {
  describe('TRIM', () => {
    it('should trim whitespace', () => {
      const result = TransformationEngine.transform('  hello world  ', ['TRIM']);
      expect(result.result).toBe('hello world');
      expect(result.error).toBeUndefined();
    });

    it('should handle null values', () => {
      const result = TransformationEngine.transform(null, ['TRIM']);
      expect(result.result).toBeNull();
    });

    it('should error on non-string input', () => {
      const result = TransformationEngine.transform(123, ['TRIM']);
      expect(result.error).toBeDefined();
      expect(result.error?.error_message).toContain('requires string input');
    });
  });

  describe('UPPERCASE', () => {
    it('should convert to uppercase', () => {
      const result = TransformationEngine.transform('hello', ['UPPERCASE']);
      expect(result.result).toBe('HELLO');
    });

    it('should handle mixed case', () => {
      const result = TransformationEngine.transform('HeLLo WoRLd', ['UPPERCASE']);
      expect(result.result).toBe('HELLO WORLD');
    });
  });

  describe('LOWERCASE', () => {
    it('should convert to lowercase', () => {
      const result = TransformationEngine.transform('HELLO', ['LOWERCASE']);
      expect(result.result).toBe('hello');
    });
  });

  describe('SPLIT_FULL_NAME', () => {
    it('should split full name into first and last', () => {
      const result = TransformationEngine.transform('John Smith', ['SPLIT_FULL_NAME']);
      expect(result.result.first_name).toBe('John');
      expect(result.result.last_name).toBe('Smith');
    });

    it('should handle multiple middle names', () => {
      const result = TransformationEngine.transform('John Michael Smith', ['SPLIT_FULL_NAME']);
      expect(result.result.first_name).toBe('John');
      expect(result.result.last_name).toBe('Michael Smith');
    });

    it('should error on missing full name', () => {
      const result = TransformationEngine.transform('', ['SPLIT_FULL_NAME']);
      expect(result.error).toBeDefined();
    });

    it('should error on single name', () => {
      const result = TransformationEngine.transform('John', ['SPLIT_FULL_NAME']);
      expect(result.error).toBeDefined();
      expect(result.error?.error_message).toContain('at least first and last name');
    });
  });

  describe('STRING_TO_BOOLEAN', () => {
    it('should parse yes values', () => {
      expect(TransformationEngine.transform('yes', ['STRING_TO_BOOLEAN']).result).toBe(true);
      expect(TransformationEngine.transform('YES', ['STRING_TO_BOOLEAN']).result).toBe(true);
      expect(TransformationEngine.transform('y', ['STRING_TO_BOOLEAN']).result).toBe(true);
      expect(TransformationEngine.transform('true', ['STRING_TO_BOOLEAN']).result).toBe(true);
      expect(TransformationEngine.transform('1', ['STRING_TO_BOOLEAN']).result).toBe(true);
    });

    it('should parse no values', () => {
      expect(TransformationEngine.transform('no', ['STRING_TO_BOOLEAN']).result).toBe(false);
      expect(TransformationEngine.transform('false', ['STRING_TO_BOOLEAN']).result).toBe(false);
      expect(TransformationEngine.transform('0', ['STRING_TO_BOOLEAN']).result).toBe(false);
    });

    it('should error on invalid values', () => {
      const result = TransformationEngine.transform('maybe', ['STRING_TO_BOOLEAN']);
      expect(result.error).toBeDefined();
    });
  });

  describe('STATUS_TO_BOOLEAN', () => {
    it('should map active/verified/approved to true', () => {
      expect(TransformationEngine.transform('active', ['STATUS_TO_BOOLEAN']).result).toBe(true);
      expect(TransformationEngine.transform('verified', ['STATUS_TO_BOOLEAN']).result).toBe(true);
      expect(TransformationEngine.transform('approved', ['STATUS_TO_BOOLEAN']).result).toBe(true);
    });

    it('should map other statuses to false', () => {
      expect(TransformationEngine.transform('pending', ['STATUS_TO_BOOLEAN']).result).toBe(false);
      expect(TransformationEngine.transform('inactive', ['STATUS_TO_BOOLEAN']).result).toBe(false);
    });

    it('should handle null values', () => {
      expect(TransformationEngine.transform(null, ['STATUS_TO_BOOLEAN']).result).toBe(false);
    });
  });

  describe('DATE_STRING_TO_ISO_DATE', () => {
    it('should parse valid dates', () => {
      const result = TransformationEngine.transform('2023-05-15', ['DATE_STRING_TO_ISO_DATE']);
      expect(result.result).toContain('2023-05-15');
      expect(result.error).toBeUndefined();
    });

    it('should error on invalid dates', () => {
      const result = TransformationEngine.transform('2026-99-44', ['DATE_STRING_TO_ISO_DATE']);
      expect(result.error).toBeDefined();
    });

    it('should error on empty dates', () => {
      const result = TransformationEngine.transform('', ['DATE_STRING_TO_ISO_DATE']);
      expect(result.error).toBeDefined();
    });
  });

  describe('STRING_TO_DECIMAL', () => {
    it('should parse valid decimals', () => {
      expect(TransformationEngine.transform('1234.56', ['STRING_TO_DECIMAL']).result).toBe(1234.56);
      expect(TransformationEngine.transform('100', ['STRING_TO_DECIMAL']).result).toBe(100);
    });

    it('should strip non-numeric characters', () => {
      const result = TransformationEngine.transform('$1,234.56', ['STRING_TO_DECIMAL']);
      expect(result.result).toBe(1234.56);
    });

    it('should error on non-numeric strings', () => {
      const result = TransformationEngine.transform('not-a-number', ['STRING_TO_DECIMAL']);
      expect(result.error).toBeDefined();
    });
  });

  describe('NULL_IF_EMPTY', () => {
    it('should convert empty string to null', () => {
      expect(TransformationEngine.transform('', ['NULL_IF_EMPTY']).result).toBeNull();
      expect(TransformationEngine.transform('   ', ['NULL_IF_EMPTY']).result).toBeNull();
    });

    it('should preserve non-empty values', () => {
      expect(TransformationEngine.transform('hello', ['NULL_IF_EMPTY']).result).toBe('hello');
    });

    it('should handle null and undefined', () => {
      expect(TransformationEngine.transform(null, ['NULL_IF_EMPTY']).result).toBeNull();
      expect(TransformationEngine.transform(undefined, ['NULL_IF_EMPTY']).result).toBeNull();
    });
  });

  describe('Chained transformations', () => {
    it('should apply TRIM then LOWERCASE', () => {
      const result = TransformationEngine.transform('  HELLO WORLD  ', ['TRIM', 'LOWERCASE']);
      expect(result.result).toBe('hello world');
    });

    it('should apply TRIM then UPPERCASE', () => {
      const result = TransformationEngine.transform('  hello world  ', ['TRIM', 'UPPERCASE']);
      expect(result.result).toBe('HELLO WORLD');
    });

    it('should stop on first error', () => {
      const result = TransformationEngine.transform(123, ['TRIM', 'UPPERCASE']);
      expect(result.error).toBeDefined();
    });
  });

  describe('DIRECT_COPY', () => {
    it('should copy values as-is', () => {
      expect(TransformationEngine.transform('hello', ['DIRECT_COPY']).result).toBe('hello');
      expect(TransformationEngine.transform(123, ['DIRECT_COPY']).result).toBe(123);
      expect(TransformationEngine.transform(true, ['DIRECT_COPY']).result).toBe(true);
      expect(TransformationEngine.transform(null, ['DIRECT_COPY']).result).toBeNull();
    });
  });
});
