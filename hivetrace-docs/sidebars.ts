import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  /** "Обзор" */
  docsSidebar: [
    {
      type: 'category',
      label: 'Что такое HiveTrace?',
      collapsible: true,
      collapsed: false,
      items: [
        'overview/introduction',
        {
          type: 'doc',
          id: 'overview/hivetrace-monitoring',
          label: 'HiveTrace Monitoring',
        },
      ],
    },
  ],

  /** "Документация" */
  guidesSidebar: [
    {
      type: 'category',
      label: 'HiveTrace Monitoring',
      collapsible: true,
      collapsed: false,
      items: [
        'guides/hivetrace-monitoring/authorization',
        'guides/hivetrace-monitoring/dashboard',
        'guides/hivetrace-monitoring/applications',
        'guides/hivetrace-monitoring/censorship-policies',
        'guides/hivetrace-monitoring/personal-data-cleaning',
        'guides/hivetrace-monitoring/token-thresholds',
        'guides/hivetrace-monitoring/alerting-configuration',
        'guides/hivetrace-monitoring/users',
        'guides/hivetrace-monitoring/session-analytics',
        'guides/hivetrace-monitoring/api-tokens',
        'guides/hivetrace-monitoring/alerts',
        'guides/hivetrace-monitoring/system-users',
      ],
    },
  ],

  /** "API" */
  apiSidebar: [
    {
      type: 'category',
      label: 'API',
      collapsible: true,
      collapsed: false,
      items: [
        'api/index',
        'api/authentication',
        'api/base-api',
        'api/override-api',
      ],
    },
    {
      type: 'category',
      label: 'SDK',
      collapsible: true,
      collapsed: false,
      items: [
        {
          type: 'doc',
          id: 'SDK/overview',
        },
        {
          type: 'doc',
          id: 'SDK/single_llm_applications/index',
        },
        {
          type: 'category',
          label: 'Мультиагенты',
          collapsible: true,
          collapsed: true,
          items: [
            'SDK/Agents/CrewAI/index',
            'SDK/Agents/Langchain/index',
            'SDK/Agents/OpenAI Agents/index',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'HiveTrace Gateway',
      collapsible: true,
      collapsed: false,
      items: [
        'hivetrace-gateway/index',
        'hivetrace-gateway/single-llm',
        'hivetrace-gateway/multi-agents',
      ],
    },
  ],
};

export default sidebars;
