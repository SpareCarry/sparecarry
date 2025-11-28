/**
 * RealtimeMonitor - Development tool to monitor active Realtime connections
 * 
 * Only renders in development mode.
 * Shows active channels, connection count, and debug info.
 */

"use client";

import { useEffect, useState } from 'react';
import { RealtimeManager } from '../../lib/realtime/RealtimeManager';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

export function RealtimeMonitor() {
  const [debugInfo, setDebugInfo] = useState(RealtimeManager.getDebugInfo());
  const [isVisible, setIsVisible] = useState(false);
  const isDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (!isDev) {
      return;
    }

    // Update debug info every 2 seconds
    const interval = setInterval(() => {
      setDebugInfo(RealtimeManager.getDebugInfo());
    }, 2000);

    return () => clearInterval(interval);
  }, [isDev]);

  // Only show in development
  if (!isDev) {
    return null;
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          size="sm"
          variant="outline"
          className="bg-yellow-100 border-yellow-300"
        >
          RT: {debugInfo.totalChannels}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-auto">
      <Card className="bg-yellow-50 border-yellow-300">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold">Realtime Monitor</CardTitle>
            <Button
              onClick={() => setIsVisible(false)}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="font-semibold">
            Active Channels: {debugInfo.totalChannels} / 10
          </div>
          {debugInfo.totalChannels > 6 && (
            <div className="text-red-600 font-bold">
              ⚠️ WARNING: High connection count!
            </div>
          )}
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {debugInfo.channels.map((ch) => (
              <div
                key={ch.name}
                className="p-2 bg-white rounded border border-slate-200"
              >
                <div className="font-mono text-xs font-semibold">{ch.name}</div>
                <div className="text-slate-600">
                  Callbacks: {ch.callbacks} | 
                  Inactive: {Math.round(ch.inactiveTime / 1000)}s
                </div>
                <div className="text-slate-500 text-xs">
                  Table: {ch.config.table}
                  {ch.config.filter && ` | Filter: ${ch.config.filter.substring(0, 30)}...`}
                </div>
              </div>
            ))}
          </div>
          <Button
            onClick={() => {
              console.log('RealtimeManager Debug Info:', RealtimeManager.getDebugInfo());
            }}
            size="sm"
            variant="outline"
            className="w-full mt-2"
          >
            Log to Console
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

