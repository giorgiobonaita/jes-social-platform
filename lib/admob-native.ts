import { registerPlugin } from '@capacitor/core';

export interface AdMobNativePlugin {
  initialize(): Promise<void>;
  load(options: { adUnitId: string; x: number; y: number; width: number; height: number }): Promise<void>;
  updatePosition(options: { x: number; y: number; width: number; height: number }): Promise<void>;
  show(): Promise<void>;
  hide(): Promise<void>;
  destroy(): Promise<void>;
}

export const AdMobNative = registerPlugin<AdMobNativePlugin>('AdMobNative', {
  web: () => ({
    initialize: async () => {},
    load: async () => {},
    updatePosition: async () => {},
    show: async () => {},
    hide: async () => {},
    destroy: async () => {},
  }),
});
