import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'prompt', // or 'autoUpdate'
            includeAssets: ['favicon.ico', 'logo192.png', 'logo512.png'],
            manifest: {
                short_name: "AgriTrade",
                name: "Agri-Trading Platform",
                icons: [
                    {
                        src: "favicon.ico",
                        sizes: "64x64 32x32 24x24 16x16",
                        type: "image/x-icon"
                    },
                    {
                        src: "logo192.png",
                        type: "image/png",
                        sizes: "192x192"
                    },
                    {
                        src: "logo512.png",
                        type: "image/png",
                        sizes: "512x512"
                    }
                ],
                start_url: ".",
                display: "standalone",
                theme_color: "#1E5631",
                background_color: "#ffffff"
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'gstatic-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            },
                        }
                    },
                    {
                        urlPattern: ({ url }) => url.pathname.startsWith('/api'), // Cache API calls (NetworkFirst is safe)
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'api-cache',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60 * 24 // 1 day
                            },
                            networkTimeoutSeconds: 10 // Fallback to cache if network slow
                        }
                    }
                ]
            }
        })
    ],
    esbuild: {
        loader: 'jsx',
        include: /src\/.*\.(js|jsx)$/,
        exclude: [],
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
                secure: false,
            },
        },
    },
    build: {
        outDir: 'build',
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    'vendor-charts': ['apexcharts', 'react-apexcharts'],
                    'vendor-query': ['@tanstack/react-query'],
                },
            },
        },
    },
});
