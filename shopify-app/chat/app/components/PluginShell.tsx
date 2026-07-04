import styles from "./PluginShell.module.css";

export type PluginShellProps = {
  title: string;
  subtitle?: string;
  showLogos?: boolean;
  children: React.ReactNode;
};

export function PluginShell({
  title,
  subtitle,
  showLogos = true,
  children,
}: PluginShellProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.bybeltMark} aria-hidden />
          <span className={styles.brandName}>Bybelt</span>
        </div>
        <a className={styles.helpLink} href="https://help.bybelt.com" target="_blank" rel="noreferrer">
          Need help?
        </a>
      </header>

      <main className={styles.main}>
        <div className={styles.layout}>
          <div className={styles.card}>
            {showLogos ? (
              <div className={styles.logos} aria-hidden>
                <span className={styles.logoBybelt} />
                <span className={styles.swap}>⇄</span>
                <span className={styles.logoShopify} />
              </div>
            ) : null}
            <h1 className={styles.title}>{title}</h1>
            {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
            {children}
          </div>
          <div className={styles.hero} aria-hidden>
            <div className={styles.heroCard}>
              <div className={styles.heroBubble} />
              <div className={styles.heroLine} />
              <div className={styles.heroLineShort} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
