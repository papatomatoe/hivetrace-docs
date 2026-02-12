import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';

import styles from './styles.module.css';

export default function Footer(): React.JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  const year = new Date().getFullYear();
  const docusaurusLogo = useBaseUrl('/img/docusaurus.png');

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.inner}>
        <span className={styles.muted}>© {year} {siteConfig.title}</span>
        <span className={styles.sep}>·</span>
        <a
          className={styles.docusaurusLink}
          href="https://docusaurus.io/"
          target="_blank"
          rel="noopener noreferrer">
          <img
            className={styles.docusaurusLogo}
            src={docusaurusLogo}
            alt="Docusaurus"
            loading="lazy"
          />
          <span className={styles.docusaurusText}>Docusaurus</span>
        </a>
      </div>
    </footer>
  );
}

