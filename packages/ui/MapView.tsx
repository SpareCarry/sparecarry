/**
 * MapView - Universal component with memoization
 * Automatically uses .web.tsx or .native.tsx based on platform
 */

import { memo } from 'react';
import { isWeb } from '@sparecarry/lib/platform';

type MapViewComponent = typeof import('./MapView.web').MapView;

const ComponentImpl: MapViewComponent = isWeb
  ? require('./MapView.web').MapView
  : require('./MapView.native').MapView;

export const MapView = memo(ComponentImpl);
