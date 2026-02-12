import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {
  useThemeConfig,
  ErrorCauseBoundary,
  ThemeClassNames,
} from '@docusaurus/theme-common';
import {
  splitNavbarItems,
  useAlternatePageUtils,
  useNavbarMobileSidebar,
} from '@docusaurus/theme-common/internal';
import NavbarItem, {type Props as NavbarItemConfig} from '@theme/NavbarItem';
import NavbarColorModeToggle from '@theme/Navbar/ColorModeToggle';
import SearchBar from '@theme/SearchBar';
import NavbarMobileSidebarToggle from '@theme/Navbar/MobileSidebar/Toggle';
import NavbarLogo from '@theme/Navbar/Logo';

import styles from './styles.module.css';

function GlobeIcon(): ReactNode {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false">
      <path
        fill="currentColor"
        d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm7.93 9h-3.18a15.7 15.7 0 0 0-1.3-6.01A8.02 8.02 0 0 1 19.93 11ZM12 4c.72 0 1.97 1.46 2.75 5H9.25C10.03 5.46 11.28 4 12 4ZM4.07 13h3.18c.22 2.1.8 4.21 1.3 6.01A8.02 8.02 0 0 1 4.07 13Zm3.18-2H4.07a8.02 8.02 0 0 1 4.48-6.01A15.7 15.7 0 0 0 7.25 11Zm2 2h5.5c-.78 3.54-2.03 5-2.75 5-.72 0-1.97-1.46-2.75-5Zm7.5 0h3.18a8.02 8.02 0 0 1-4.48 6.01c.5-1.8 1.08-3.91 1.3-6.01ZM9.25 11h5.5c.07.66.11 1.33.11 2s-.04 1.34-.11 2h-5.5a15.9 15.9 0 0 1-.11-2c0-.67.04-1.34.11-2Zm7.39 2c0-.67-.04-1.34-.1-2h3.39a7.96 7.96 0 0 1 0 4h-3.39c.06-.66.1-1.33.1-2ZM4.07 11h3.39c-.06.66-.1 1.33-.1 2s.04 1.34.1 2H4.07a7.96 7.96 0 0 1 0-4Z"
      />
    </svg>
  );
}

function useNavbarItems() {
  // TODO temporary casting until ThemeConfig type is improved
  return useThemeConfig().navbar.items as NavbarItemConfig[];
}

function NavbarItems({items}: {items: NavbarItemConfig[]}): ReactNode {
  return (
    <>
      {items.map((item, i) => (
        <ErrorCauseBoundary
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          onError={(error) =>
            new Error(
              `A theme navbar item failed to render.
Please double-check the following navbar item (themeConfig.navbar.items) of your Docusaurus config:
${JSON.stringify(item, null, 2)}`,
              {cause: error},
            )
          }>
          <NavbarItem {...item} />
        </ErrorCauseBoundary>
      ))}
    </>
  );
}

export default function NavbarContent(): ReactNode {
  const mobileSidebar = useNavbarMobileSidebar();
  const {
    siteConfig,
    i18n: {currentLocale, defaultLocale},
  } = useDocusaurusContext();
  const alternatePageUtils = useAlternatePageUtils();

  const customFields = (siteConfig.customFields ?? {}) as {
    dashboardUrl?: string;
    demoCtaUrl?: string;
    pypiUrl?: string;
  };
  const dashboardUrl = customFields.dashboardUrl ?? 'https://hivetrace.ai/';
  const demoCtaUrl = customFields.demoCtaUrl ?? 'https://hivetrace.ai/preview/';
  const pypiUrl = customFields.pypiUrl ?? 'https://pypi.org/project/hivetrace/';

  const items = useNavbarItems();
  const [leftItemsRaw, rightItemsRaw] = splitNavbarItems(items);

  // We render search explicitly in the top row.
  const leftItems = leftItemsRaw.filter((item) => item.type !== 'search');
  const rightItems = rightItemsRaw.filter((item) => {
    if (item.type === 'search' || item.type === 'localeDropdown' || item.type === 'html') {
      return false;
    }
    if (item.className === 'navbarDashboardItem' || item.className === 'navbarPypiItem') {
      return false;
    }
    return true;
  });

  const targetLocale = currentLocale === 'en' ? defaultLocale : 'en';
  const languageSwitchUrl = alternatePageUtils.createUrl({
    locale: targetLocale,
    fullyQualified: false,
  });
  const languageSwitchLabel =
    targetLocale === 'en' ? 'Switch to English' : 'Переключить на русский';

  return (
    // Do not use Infima's `.navbar__inner` (flex-wrap/space-between).
    // We own the layout completely to match product-style docs headers.
    <div className={styles.inner}>
      <div className={styles.topRow}>
        <div
          className={clsx(
            ThemeClassNames.layout.navbar.containerLeft,
            'navbar__items',
            styles.topLeft,
          )}>
          {!mobileSidebar.disabled && <NavbarMobileSidebarToggle />}
          <NavbarLogo />
        </div>

        <div className={clsx(styles.topSearch)}>
          <div className={styles.searchContainer}>
            <SearchBar />
          </div>
        </div>

        <div
          className={clsx(
            ThemeClassNames.layout.navbar.containerRight,
            'navbar__items navbar__items--right',
            styles.topRight,
          )}>
          <NavbarItems items={rightItems} />
          <a
            className="navbar__item navbar__link"
            href={dashboardUrl}
            target="_blank"
            rel="noopener noreferrer">
            {currentLocale === 'en' ? 'Website' : 'Вебсайт'}
          </a>
          <a
            className="navbar__item navbar__link navbar__cta"
            href={demoCtaUrl}
            target="_blank"
            rel="noopener noreferrer">
            {currentLocale === 'en' ? 'Book a demo' : 'Запросить демо'}
          </a>
          <a
            className="navbar__item navbar__link"
            href={pypiUrl}
            target="_blank"
            rel="noopener noreferrer">
            PyPI
          </a>
          <a
            className={styles.langToggle}
            href={languageSwitchUrl}
            aria-label={languageSwitchLabel}
            title={languageSwitchLabel}>
            <span className={styles.langToggleIcon}>
              <GlobeIcon />
            </span>
          </a>
          <NavbarColorModeToggle className={styles.colorModeToggle} />
        </div>
      </div>

      <div className={styles.bottomRow}>
        <div
          className={clsx(
            ThemeClassNames.layout.navbar.containerLeft,
            styles.bottomLeft,
          )}>
          <div className={styles.bottomNav}>
            <NavbarItems items={leftItems} />
          </div>
        </div>
      </div>
    </div>
  );
}

