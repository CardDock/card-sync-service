const config = {
  title: 'Card Sync Service',
  tagline: 'Documentación técnica del proyecto',
  favicon: undefined,
  url: 'http://localhost:3800',
  baseUrl: '/',
  organizationName: 'CardDock',
  projectName: 'card-sync-service',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  i18n: {
    defaultLocale: 'es',
    locales: ['es'],
  },
  presets: [
    [
      'classic',
      {
        docs: {
          path: '../docs',
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
          showLastUpdateTime: true,
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      },
    ],
  ],
  themeConfig: {
    navbar: {
      title: 'Card Sync Service',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docs',
          position: 'left',
          label: 'Documentación',
        },
        {
          href: 'https://github.com/CardDock/card-sync-service',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentación',
          items: [
            {
              label: 'Introducción',
              to: '/',
            },
          ],
        },
      ],
      copyright: `Card Sync Service`,
    },
  },
};

module.exports = config;
