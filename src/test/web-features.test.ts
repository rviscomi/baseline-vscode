import assert from 'assert';
import { getFeature, getAllFeatures, isValidFeatureId, getReleaseDate, getFeatureByCompatKey, isValidCompatKey } from '../web-features.js';

suite('Web Features Test Suite', () => {

  suite('getFeature', () => {
    test('should return exactly the specified feature', () => {
      const feature = getFeature('grid');
      assert.ok(feature, 'Expected grid to exist');
      assert.strictEqual(feature.name, 'Grid');
    });

    test('should return undefined for unknown feature', () => {
      assert.strictEqual(getFeature('non-existent-feature'), undefined);
    });
  });

  suite('getAllFeatures', () => {
    test('should return all web features', () => {
      const features = getAllFeatures();
      assert.ok(features['grid']);
      assert.ok(features['flexbox']);
      assert.ok(Object.keys(features).length > 0);
    });
  });

  suite('isValidFeatureId', () => {
    test('should return true for valid feature', () => {
      assert.strictEqual(isValidFeatureId('grid'), true);
    });

    test('should return false for missing feature', () => {
      assert.strictEqual(isValidFeatureId('non-existent-feature'), false);
    });

    test('should return false for non-features', () => {
      // e.g., something that is 'moved' or 'split'
      assert.strictEqual(isValidFeatureId('display-grid-lanes'), false);
    });
  });

  suite('getReleaseDate', () => {
    test('should return release date for known browser/version', () => {
      const releaseDate = getReleaseDate('chrome', '57');
      assert.strictEqual(typeof releaseDate, 'string');
      assert.strictEqual(releaseDate, '2017-03-09');
    });

    test('should handle unknown browser gracefully', () => {
      assert.strictEqual(getReleaseDate('unknown_browser', '1'), 'Unknown');
    });

    test('should handle unknown version gracefully', () => {
      assert.strictEqual(getReleaseDate('chrome', '9999'), 'Unknown');
    });
  });

  suite('getFeatureByCompatKey', () => {
    test('should resolve valid BCD key to parent feature and canonical key', () => {
      const match = getFeatureByCompatKey('api.Scheduler.yield');
      assert.ok(match, 'Expected api.Scheduler.yield to be found');
      assert.strictEqual(match.featureId, 'scheduler');
      assert.strictEqual(match.compatKey, 'api.Scheduler.yield');
      assert.strictEqual(match.feature.name, 'Scheduler API');
    });

    test('should resolve case-insensitively while returning canonical key', () => {
      const match = getFeatureByCompatKey('api.scheduler.yield');
      assert.ok(match, 'Expected case-insensitive match to be found');
      assert.strictEqual(match.featureId, 'scheduler');
      assert.strictEqual(match.compatKey, 'api.Scheduler.yield');
    });

    test('should return undefined for unknown BCD key', () => {
      assert.strictEqual(getFeatureByCompatKey('api.Scheduler.nonexistent'), undefined);
      assert.strictEqual(getFeatureByCompatKey('nonexistent.key'), undefined);
    });
  });

  suite('isValidCompatKey', () => {
    test('should return true for valid BCD key', () => {
      assert.strictEqual(isValidCompatKey('api.Scheduler.yield'), true);
      assert.strictEqual(isValidCompatKey('css.properties.accent-color'), true);
    });

    test('should return false for invalid BCD key', () => {
      assert.strictEqual(isValidCompatKey('api.Scheduler.nonexistent'), false);
      assert.strictEqual(isValidCompatKey('not-a-key'), false);
    });
  });
});
