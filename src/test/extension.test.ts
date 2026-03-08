import assert from 'assert';
import { PATTERNS } from '../constants.js';
import { extractFeatureId } from '../utils.js';

suite('Baseline Patterns Test Suite', () => {

	suite('PREFIX pattern', () => {
		test('should match baseline/feature-id', () => {
			const text = 'Check out baseline/flexbox results';
			const match = text.match(PATTERNS.PREFIX.full);
			assert.ok(match, 'Should match');
			assert.strictEqual(extractFeatureId(match), 'flexbox');
		});

		test('should trigger on baseline/', () => {
			assert.ok('baseline/'.match(PATTERNS.PREFIX.trigger), 'Should trigger');
		});
	});

	suite('TAG pattern', () => {
		test('should match <baseline-status featureId="grid">', () => {
			const text = '<baseline-status featureId="grid">';
			const match = text.match(PATTERNS.TAG.full);
			assert.ok(match, 'Should match');
			assert.strictEqual(extractFeatureId(match), 'grid');
		});

		test('should trigger on tag prefix', () => {
			assert.ok('<baseline-status featureId="'.match(PATTERNS.TAG.trigger), 'Should trigger');
		});
	});

	suite('MACRO pattern', () => {
		test('should match {{ BASELINE_STATUS("fetch-priority") }}', () => {
			const text = '{{ BASELINE_STATUS("fetch-priority") }}';
			const match = text.match(PATTERNS.MACRO.full);
			assert.ok(match, 'Should match');
			assert.strictEqual(extractFeatureId(match), 'fetch-priority');
		});

		test('should trigger on macro prefix', () => {
			assert.ok('{{ BASELINE_STATUS("'.match(PATTERNS.MACRO.trigger), 'Should trigger');
		});
	});

	suite('TODO pattern', () => {
		test('should match TODO(baseline/aspect-ratio)', () => {
			const text = '// TODO(baseline/aspect-ratio)';
			const match = text.match(PATTERNS.TODO.full);
			assert.ok(match, 'Should match');
			assert.strictEqual(extractFeatureId(match), 'aspect-ratio');
		});

		test('should trigger on todo prefix', () => {
			assert.ok('// TODO(baseline/'.match(PATTERNS.TODO.trigger), 'Should trigger');
		});
	});
});
