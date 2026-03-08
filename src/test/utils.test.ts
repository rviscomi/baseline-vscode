import assert from 'assert';
import { getBaselineStatus, getBrowserName, sanitizeFeatureName } from '../utils.js';

suite('Utils Test Suite', () => {

	suite('getBaselineStatus', () => {
		test('should handle missing status', () => {
			assert.strictEqual(getBaselineStatus(undefined), 'Status unavailable');
			assert.strictEqual(getBaselineStatus(null), 'Status unavailable');
		});

		test('should handle low baseline status', () => {
			const status = { baseline: 'low', baseline_low_date: '2023-01-01' };
			assert.strictEqual(getBaselineStatus(status), 'Baseline Newly available since 2023-01-01');
		});

		test('should handle high baseline status', () => {
			const status = { baseline: 'high', baseline_high_date: '2020-01-01' };
			assert.strictEqual(getBaselineStatus(status), 'Baseline Widely available since 2020-01-01');
		});

		test('should handle limited baseline status', () => {
			assert.strictEqual(getBaselineStatus({ baseline: false }), 'Limited availability across major browsers');
		});
	});

	suite('getBrowserName', () => {
		test('should map known browser IDs correctly', () => {
			assert.strictEqual(getBrowserName('chrome'), 'Chrome');
			assert.strictEqual(getBrowserName('firefox'), 'Firefox');
		});

		test('should return exactly the input for unknown browsers if missing', () => {
			// Because of `const name = BROWSER_NAME[browserId]; return name || browserId;`
			assert.strictEqual(getBrowserName('unknown_browser'), 'unknown_browser');
		});
	});

	suite('sanitizeFeatureName', () => {
		test('should escape angle brackets for tags', () => {
			assert.strictEqual(sanitizeFeatureName('<dialog>'), '&#x3C;dialog>');
		});

		test('should not modify normal names', () => {
			assert.strictEqual(sanitizeFeatureName('flexbox'), 'flexbox');
		});
	});
});
