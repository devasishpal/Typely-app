
    import { defineConfig, loadConfigFromFile } from "vite";
    import type { ConfigEnv } from "vite";
    import path from "path";
    import {
      makeTagger,
      injectedGuiListenerPlugin,
      injectOnErrorPlugin,
      monitorPlugin
    } from "miaoda-sc-plugin";

    const env: ConfigEnv = { command: "serve", mode: "development" };
    const configFile = path.resolve(__dirname, "vite.config.ts");
    const result = await loadConfigFromFile(env, configFile);
    const userConfig = result?.config;

    export default defineConfig({
      ...userConfig,
      // 将 Vite 缓存目录设置为项目本地目录，避免在 /workspace/node_modules/ 下创建
      cacheDir: path.resolve(__dirname, "node_modules/.vite"),
      plugins: [
        makeTagger(),
        injectedGuiListenerPlugin({
          path: 'https://miaoda-resource-static.s3cdn.medo.dev/common/v2/injected.js'
        }),
        injectOnErrorPlugin(),
        ...(userConfig?.plugins || []),
        {
          name: 'hmr-toggle',
          configureServer(server) {
            let hmrEnabled = true;

            const _send = server.ws.send;
            server.ws.send = (payload: any) => {
              if (hmrEnabled) {
                return _send.call(server.ws, payload);
              } else {
                console.log('[HMR disabled] skipped payload:', payload.type);
              }
            };

            server.middlewares.use('/innerapi/v1/sourcecode/__hmr_off', (_req, res) => {
              hmrEnabled = false;
              const body = { status: 0, msg: 'HMR disabled' };
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(body));
            });

            server.middlewares.use('/innerapi/v1/sourcecode/__hmr_on', (_req, res) => {
              hmrEnabled = true;
              const body = { status: 0, msg: 'HMR enabled' };
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(body));
            });

            server.middlewares.use('/innerapi/v1/sourcecode/__hmr_reload', (_req, res) => {
              if (hmrEnabled) {
                server.ws.send({ type: 'full-reload', path: '*' });
              }
              res.statusCode = 200;
              const body = { status: 0, msg: 'Manual full reload triggered' };
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(body));
            });
          },
          load(id) {
            if (id === 'virtual:after-update') {
              return `
                if (import.meta.hot) {
                  import.meta.hot.on('vite:afterUpdate', () => {
                    window.postMessage({ type: 'editor-update' }, '*');
                  });
                }
              `;
            }
          },
          transformIndexHtml(html) {
            return {
              html,
              tags: [
                {
                  tag: 'script',
                  attrs: { type: 'module', src: '/@id/virtual:after-update' },
                  injectTo: 'body'
                }
              ]
            };
          }
        },
        monitorPlugin({
          scriptSrc: 'https://miaoda-resource-static.s3cdn.medo.dev/sentry/browser.sentry.min.js',
          sentryDsn: 'https://e3c07b90fcb5207f333d50ac24a99d3e@sentry.miaoda.cn/233',
          environment: 'undefined',
          appId: 'app-9g2p90vncjcx'
        })
      ]
    });
    