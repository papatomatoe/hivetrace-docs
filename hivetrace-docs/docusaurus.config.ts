import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const DASHBOARD_URL = 'https://hivetrace.ai/';
const DEMO_CTA_URL = 'https://hivetrace.ai/preview/';

const config: Config = {
  title: 'HiveTrace Docs',
  // Host for GitHub Pages. The path prefix is controlled via `baseUrl`.
  // For `https://hivetrace.github.io/docs/` use:
  // - url: https://hivetrace.github.io
  // - baseUrl: /docs/  (set via DOCS_BASE_URL in CI)
  url: 'https://hivetrace.github.io',
  favicon: 'img/favicon.ico',

  customFields: {
    dashboardUrl: DASHBOARD_URL,
    demoCtaUrl: DEMO_CTA_URL,
    pypiUrl: 'https://pypi.org/project/hivetrace/',
  },

  future: {
    v4: true,
  },

  baseUrl: process.env.DOCS_BASE_URL ?? '/',

  organizationName: 'hivetrace',
  projectName: 'docs',
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'ru',
    locales: ['ru', 'en'],
    localeConfigs: {
      ru: {
        label: 'Русский',
        direction: 'ltr',
        htmlLang: 'ru',
      },
      en: {
        label: 'English',
        direction: 'ltr',
        htmlLang: 'en',
      },
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        indexDocs: true,
        indexBlog: false,
        docsRouteBasePath: '/',
        language: ['ru', 'en'],
        searchBarShortcutHint: false,
      },
    ],
  ],

  themeConfig: {
    image: 'img/hivetrace-social-card.jpg',
    navbar: {
      logo: {
        alt: 'HiveTrace logo',
        src: 'img/logo_light.svg',
        srcDark: 'img/logo_dark.svg',
        height: 28,
        width: 28,
        className: 'navbarLogo',
      },
      hideOnScroll: false,
      items: [
        {
          type: 'docSidebar',
          position: 'left',
          sidebarId: 'docsSidebar',
          label: 'Обзор',
        },
        {
          type: 'docSidebar',
          sidebarId: 'guidesSidebar',
          label: 'Документация',
          position: 'left',
        },
        {
          type: 'docSidebar',
          sidebarId: 'apiSidebar',
          label: 'Интеграция',
          position: 'left',
        },
        {
          href: DASHBOARD_URL,
          label: 'Вебсайт',
          position: 'right',
          className: 'navbarDashboardItem',
        },
        {
          type: 'html',
          position: 'right',
          value:
            `<a class="navbar__item navbar__link navbar__cta" href="${DEMO_CTA_URL}" data-navbar-cta="1">Запросить демо</a>`,
        },
        {
          href: 'https://pypi.org/project/hivetrace/',
          label: 'PyPI',
          position: 'right',
          className: 'navbarPypiItem',
        },
      ],
    },
    docs: {
      sidebar: {
        hideable: false,
        autoCollapseCategories: true,
      },
    },
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 3,
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Community',
          items: [
            {
              label: 'HiveTrace.ai',
              href: 'https://hivetrace.ai/',
            },
            {
              label: 'AI Security Lab',
              href: 'https://t.me/aisecuritylab',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} HiveTrace`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
