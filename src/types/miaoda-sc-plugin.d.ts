declare module 'miaoda-sc-plugin' {
  import type { Plugin } from 'vite';

  export function makeTagger(): Plugin;
  export function injectedGuiListenerPlugin(options: { path: string }): Plugin;
  export function injectOnErrorPlugin(): Plugin;
  export function monitorPlugin(options: { scriptSrc: string; sentryDsn?: string; environment?: string; appId?: string }): Plugin;

  const _default: {
    makeTagger: typeof makeTagger;
    injectedGuiListenerPlugin: typeof injectedGuiListenerPlugin;
    injectOnErrorPlugin: typeof injectOnErrorPlugin;
    monitorPlugin: typeof monitorPlugin;
  };

  export default _default;
}
