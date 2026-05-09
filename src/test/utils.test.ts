import assert from 'assert';
import * as vscode from 'vscode';
import { getBaselineStatus, getBrowserName, sanitizeFeatureName, findFeatureIdsInLine } from '../utils.js';
import { FeatureStatus } from '../web-features.js';

suite('Utils Test Suite', () => {

	suite('getBaselineStatus', () => {
		test('should handle missing status', () => {
			assert.strictEqual(getBaselineStatus(undefined), 'Status unavailable');
			assert.strictEqual(getBaselineStatus(null as unknown as FeatureStatus), 'Status unavailable');
		});

		test('should handle newly baseline status', () => {
			const status: FeatureStatus = { baseline: 'low', baseline_low_date: '2023-01-01' };
			assert.strictEqual(getBaselineStatus(status), 'Baseline Newly available since 2023-01-01');
		});

		test('should handle widely baseline status', () => {
			const status: FeatureStatus = { baseline: 'high', baseline_high_date: '2020-01-01' };
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

	suite('findFeatureIdsInLine', () => {
		test('should find feature ID in single parameter macro', () => {
			const mockDoc = {
				lineAt() {
					return { text: '{{ BASELINE_STATUS("webauthn") }}' };
				}
			} as unknown as vscode.TextDocument;

			const matches = findFeatureIdsInLine(mockDoc, 0);
			assert.strictEqual(matches.length, 1);
			assert.strictEqual(matches[0].featureId, 'webauthn');
			assert.strictEqual(matches[0].compatKey, undefined);
			assert.strictEqual(matches[0].startingIndex, 20);
			assert.strictEqual(matches[0].endingIndex, 28);
		});

		test('should find feature ID and compat key in dual parameter macro', () => {
			const mockDoc = {
				lineAt() {
					return { text: '{{ BASELINE_STATUS("webauthn", "api.PublicKeyCredential.getClientCapabilities_static") }}' };
				}
			} as unknown as vscode.TextDocument;

			const matches = findFeatureIdsInLine(mockDoc, 0);
			assert.strictEqual(matches.length, 1);
			assert.strictEqual(matches[0].featureId, 'webauthn');
			assert.strictEqual(matches[0].compatKey, 'api.PublicKeyCredential.getClientCapabilities_static');
			assert.strictEqual(matches[0].startingIndex, 20);
			assert.strictEqual(matches[0].endingIndex, 84);
		});
	});
});
