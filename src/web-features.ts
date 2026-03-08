import { browsers, features } from 'web-features';

export interface FeatureStatus {
  baseline?: 'low' | 'high' | false;
  baseline_low_date?: string;
  baseline_high_date?: string;
  support?: Record<string, string>;
}

export function getFeature(featureId: string) {
  return features[featureId];
}

export function getAllFeatures() {
  return features;
}

export function isValidFeatureId(featureId: string) {
  const feature = getFeature(featureId);
  return Boolean(feature && feature.kind === 'feature');
}

export function getReleaseDate(browserId: string, version: string) {
  const browser = browsers[browserId];
  if (!browser) {
    console.warn('Unknown browser ID:', browserId);
    return 'Unknown';
  }

  const release = browser.releases.find((r: any) => r.version === version);
  if (!release) {
    console.warn('Unknown version for browser', browserId, version);
    return 'Unknown';
  }

  return release.date;
}
