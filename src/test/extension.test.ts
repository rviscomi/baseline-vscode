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

		test('should match at the end of a sentence with a period', () => {
			const text = 'Check out baseline/flexbox.';
			const match = text.match(PATTERNS.PREFIX.full);
			assert.ok(match, 'Should match');
			assert.strictEqual(extractFeatureId(match), 'flexbox');
		});

		test('should match in parentheses, quotes, and comments', () => {
			assert.strictEqual(extractFeatureId('(baseline/flexbox)'.match(PATTERNS.PREFIX.full)!), 'flexbox');
			assert.strictEqual(extractFeatureId('"baseline/flexbox"'.match(PATTERNS.PREFIX.full)!), 'flexbox');
			assert.strictEqual(extractFeatureId('\'baseline/flexbox\''.match(PATTERNS.PREFIX.full)!), 'flexbox');
			assert.strictEqual(extractFeatureId('// baseline/flexbox'.match(PATTERNS.PREFIX.full)!), 'flexbox');
			assert.strictEqual(extractFeatureId('/* baseline/flexbox */'.match(PATTERNS.PREFIX.full)!), 'flexbox');
		});

		test('should match BCD keys in baseline/ prefix', () => {
			const match1 = 'Check out baseline/api.Scheduler.yield results'.match(PATTERNS.PREFIX.full);
			assert.ok(match1, 'Should match');
			assert.strictEqual(match1[1], 'api.Scheduler.yield');

			const match2 = 'Check out baseline/api.Scheduler.yield.'.match(PATTERNS.PREFIX.full);
			assert.ok(match2, 'Should match');
			assert.strictEqual(match2[1], 'api.Scheduler.yield');
		});

		test('should not match file paths or image assets', () => {
			assert.strictEqual('/images/baseline/baseline-widely-icon-dark.svg'.match(PATTERNS.PREFIX.full), null);
			assert.strictEqual('<img src="/images/baseline/baseline-widely-icon.svg" />'.match(PATTERNS.PREFIX.full), null);
			assert.strictEqual('images/baseline/baseline-widely-icon.svg'.match(PATTERNS.PREFIX.full), null);
			assert.strictEqual('./baseline/baseline-widely-icon.svg'.match(PATTERNS.PREFIX.full), null);
			assert.strictEqual('../baseline/flexbox'.match(PATTERNS.PREFIX.full), null);
			assert.strictEqual('/baseline/flexbox'.match(PATTERNS.PREFIX.full), null);
			assert.strictEqual('https://example.com/baseline/flexbox'.match(PATTERNS.PREFIX.full), null);
		});

		test('should not match files with extensions or subdirectories', () => {
			assert.strictEqual('baseline/baseline-widely-icon.svg'.match(PATTERNS.PREFIX.full), null);
			assert.strictEqual('baseline/flexbox.svg'.match(PATTERNS.PREFIX.full), null);
			assert.strictEqual('baseline/grid.png'.match(PATTERNS.PREFIX.full), null);
			assert.strictEqual('baseline/flexbox.js'.match(PATTERNS.PREFIX.full), null);
			assert.strictEqual('baseline/flexbox/index.html'.match(PATTERNS.PREFIX.full), null);
		});

		test('should trigger on baseline/', () => {
			assert.ok('baseline/'.match(PATTERNS.PREFIX.trigger), 'Should trigger');
			assert.ok('// baseline/'.match(PATTERNS.PREFIX.trigger), 'Should trigger');
			assert.ok('(baseline/'.match(PATTERNS.PREFIX.trigger), 'Should trigger');
		});

		test('should not trigger on path prefixes', () => {
			assert.strictEqual('/images/baseline/'.match(PATTERNS.PREFIX.trigger), null);
			assert.strictEqual('images/baseline/'.match(PATTERNS.PREFIX.trigger), null);
			assert.strictEqual('./baseline/'.match(PATTERNS.PREFIX.trigger), null);
			assert.strictEqual('../baseline/'.match(PATTERNS.PREFIX.trigger), null);
			assert.strictEqual('https://example.com/baseline/'.match(PATTERNS.PREFIX.trigger), null);
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

		test('should match {{ BASELINE_STATUS("webauthn", "api.PublicKeyCredential.getClientCapabilities_static") }}', () => {
			const text = '{{ BASELINE_STATUS("webauthn", "api.PublicKeyCredential.getClientCapabilities_static") }}';
			const match = text.match(PATTERNS.MACRO.full);
			assert.ok(match, 'Should match');
			assert.strictEqual(match[1], 'webauthn');
			assert.strictEqual(match[2], 'api.PublicKeyCredential.getClientCapabilities_static');
		});

		test('should match without second parameter', () => {
			const text = '{{ BASELINE_STATUS("webauthn") }}';
			const match = text.match(PATTERNS.MACRO.full);
			assert.ok(match, 'Should match');
			assert.strictEqual(match[1], 'webauthn');
			assert.strictEqual(match[2], undefined);
		});

		test('should match {{ macros.BaselineStatus("accent-color") }}', () => {
			const text = '{{ macros.BaselineStatus("accent-color") }}';
			const match = text.match(PATTERNS.MACRO.full);
			assert.ok(match, 'Should match');
			assert.strictEqual(extractFeatureId(match), 'accent-color');
		});

		test('should trigger on macro prefix', () => {
			assert.ok('{{ BASELINE_STATUS("'.match(PATTERNS.MACRO.trigger), 'Should trigger');
		});

		test('should trigger on macros prefix', () => {
			assert.ok('{{ macros.BaselineStatus("'.match(PATTERNS.MACRO.trigger), 'Should trigger');
		});
	});

	suite('TODO pattern', () => {
		test('should match TODO(baseline/aspect-ratio)', () => {
			const text = '// TODO(baseline/aspect-ratio)';
			const match = text.match(PATTERNS.TODO.full);
			assert.ok(match, 'Should match');
			assert.strictEqual(extractFeatureId(match), 'aspect-ratio');
		});

		test('should match TODO(baseline/api.Scheduler.yield)', () => {
			const text = '// TODO(baseline/api.Scheduler.yield): Remove setTimeout fallback in yieldToMain and invoke scheduler.yield() directly.';
			const match = text.match(PATTERNS.TODO.full);
			assert.ok(match, 'Should match');
			assert.strictEqual(match[1], 'api.Scheduler.yield');
		});

		test('should match BCD keys with multiple segments and builtins', () => {
			const text = 'TODO(baseline/javascript.builtins.Array.flat)';
			const match = text.match(PATTERNS.TODO.full);
			assert.ok(match, 'Should match');
			assert.strictEqual(match[1], 'javascript.builtins.Array.flat');
		});

		test('should trigger on todo prefix', () => {
			assert.ok('// TODO(baseline/'.match(PATTERNS.TODO.trigger), 'Should trigger');
		});
	});

	suite('YAML pattern', () => {
		test('should match keywords: webfeature_accent-color', () => {
			const text = 'keywords: webfeature_accent-color';
			const match = text.match(PATTERNS.YAML.full);
			assert.ok(match, 'Should match');
			assert.strictEqual(extractFeatureId(match), 'accent-color');
		});

		test('should match with multiple comma-separated keywords', () => {
			const text = 'keywords: foo:bar,hello:world,test123,webfeature_accent-color';
			const match = text.match(PATTERNS.YAML.full);
			assert.ok(match, 'Should match');
			assert.strictEqual(extractFeatureId(match), 'accent-color');
		});

		test('should trigger on yaml keyword prefix', () => {
			assert.ok('keywords: webfeature_'.match(PATTERNS.YAML.trigger), 'Should trigger');
			assert.ok('keywords: foo:bar, webfeature_'.match(PATTERNS.YAML.trigger), 'Should trigger');
		});
	});
});
