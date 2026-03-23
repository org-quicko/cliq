import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Cliq',
  tagline: 'API documentation for Cliq',

  future: {
    v4: true,
  },

  url: 'https://org-quicko.github.io',
  baseUrl: '/cliq/',

  organizationName: 'org-quicko',
  projectName: 'cliq',
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  onBrokenLinks: 'ignore',

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  headTags: [
    {
      tagName: 'link',
      attributes: {
        rel: 'icon',
        href: '/cliq/favicon/Cliqfavicon.svg',
        media: '(prefers-color-scheme: dark)',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'icon',
        href: '/cliq/favicon/Cliqfavicon.svg',
        media: '(prefers-color-scheme: light)',
      },
    },
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          docItemComponent: '@theme/ApiItem',
          sidebarCollapsible: true,
          editUrl: 'https://github.com/org-quicko/cliq/tree/main/docs',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    function webpackFallbackPlugin() {
      return {
        name: 'webpack-fallback-plugin',
        configureWebpack() {
          return {
            resolve: {
              fallback: {
                path: false,
                fs: false,
                os: false,
              },
            },
          };
        },
      };
    },
    [
      'docusaurus-plugin-openapi-docs',
      {
        id: 'api',
        docsPluginId: 'classic',
        config: {
          api: {
            specPath: './org-quicko-cliq.openapi.json',
            outputDir: 'docs',
            sidebarOptions: {
              groupPathsBy: 'tag',
            },
            hideSendButton: true,
          },
        },
      },
    ],
  ],

  themes: [
    'docusaurus-theme-openapi-docs',
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      /** @type {import("@easyops-cn/docusaurus-search-local").PluginOptions} */
      ({
        hashed: true,
        docsRouteBasePath: '/',
        docsDir: 'docs',
        indexDocs: true,
        indexBlog: false,
      }),
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'Cliq',
      logo: {
        src: '/cliq/favicon/Cliqfavicon.svg',
        href: '/',
      },
      items: [
        {
          href: 'https://github.com/org-quicko/cliq',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub repository',
        },
      ],
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      defaultLanguage: 'javascript',
    },
    languageTabs: [
      {
        highlight: 'python',
        language: 'python',
        logoClass: 'python',
      },
      {
        highlight: 'bash',
        language: 'curl',
        logoClass: 'curl',
      },
      {
        highlight: 'javascript',
        language: 'nodejs',
        logoClass: 'nodejs',
      },
      {
        highlight: 'csharp',
        language: 'csharp',
        logoClass: 'csharp',
      },
      {
        highlight: 'go',
        language: 'go',
        logoClass: 'go',
      },
      {
        highlight: 'ruby',
        language: 'ruby',
        logoClass: 'ruby',
      },
      {
        highlight: 'php',
        language: 'php',
        logoClass: 'php',
      },
      {
        highlight: 'java',
        language: 'java',
        logoClass: 'java',
        variant: 'unirest',
      },
      {
        highlight: 'powershell',
        language: 'powershell',
        logoClass: 'powershell',
      },
      {
        highlight: 'dart',
        language: 'dart',
        logoClass: 'dart',
      },
      {
        highlight: 'javascript',
        language: 'javascript',
        logoClass: 'javascript',
      },
      {
        highlight: 'c',
        language: 'c',
        logoClass: 'c',
      },
      {
        highlight: 'swift',
        language: 'swift',
        logoClass: 'swift',
      },
      {
        highlight: 'kotlin',
        language: 'kotlin',
        logoClass: 'kotlin',
      },
      {
        highlight: 'rust',
        language: 'rust',
        logoClass: 'rust',
      },
    ],
  } satisfies Preset.ThemeConfig,
};

export default config;
