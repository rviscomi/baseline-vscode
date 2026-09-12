import { browsers, features } from 'web-features';

export type WebFeature = typeof features[keyof typeof features];
export type FeatureData = Extract<WebFeature, { kind: 'feature' }>;
export type FeatureStatus = FeatureData['status'];

export type FeatureOption = FeatureData & {
  featureId: string;
  label: string;
  detail?: string;
  description?: string;
  baselineStatus: string;
};

export interface CompatFeatureMatch {
  featureId: string;
  compatKey: string;
  feature: FeatureData;
}

const bcdMap = new Map<string, CompatFeatureMatch>();

function initBcdMap() {
  for (const [featureId, feature] of Object.entries(features)) {
    if (feature.kind === 'feature' && feature.compat_features) {
      for (const compatKey of feature.compat_features) {
        const entry: CompatFeatureMatch = { featureId, compatKey, feature };
        bcdMap.set(compatKey, entry);
        if (!bcdMap.has(compatKey.toLowerCase())) {
          bcdMap.set(compatKey.toLowerCase(), entry);
        }
      }
    }
  }
}

export function getFeature(featureId: string): WebFeature | undefined {
  return features[featureId];
}

export function getFeatureByCompatKey(compatKey: string): CompatFeatureMatch | undefined {
  if (bcdMap.size === 0) {
    initBcdMap();
  }
  return bcdMap.get(compatKey) ?? bcdMap.get(compatKey.toLowerCase());
}

export function getAllFeatures(): typeof features {
  return features;
}

export function isValidFeatureId(featureId: string): boolean {
  const feature = getFeature(featureId);
  return Boolean(feature && feature.kind === 'feature');
}

export function isValidCompatKey(compatKey: string): boolean {
  return Boolean(getFeatureByCompatKey(compatKey));
}

export function getReleaseDate(browserId: string, version: string): string {
  const browser = browsers[browserId as keyof typeof browsers];
  if (!browser) {
    console.warn('Unknown browser ID:', browserId);
    return 'Unknown';
  }

  const release = browser.releases.find((r: { version: string, date: string }) => r.version === version);
  if (!release) {
    console.warn('Unknown version for browser', browserId, version);
    return 'Unknown';
  }

  return release.date;
}
