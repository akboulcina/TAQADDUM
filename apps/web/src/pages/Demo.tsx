import { useState } from 'react';

import { AlertBanner, Button, StatusBadge, Text } from '@taqaddum/ui';
import { useTranslation, type Locale } from '@taqaddum/i18n-ui';

import '@taqaddum/design-tokens/tokens.css';

import './demo.css';

export function Demo() {
  const { locale, setLocale, t, direction } = useTranslation('fr');
  const [alertVisible, setAlertVisible] = useState(true);

  const locales: Locale[] = ['fr', 'ar', 'en'];

  return (
    <div className="demo" dir={direction}>
      <header className="demo__header">
        <Text as="h1" variant="body-md">
          {t('app_name')}
        </Text>

        <nav className="demo__locale-switcher" aria-label="Language">
          {locales.map((candidate) => (
            <Button
              key={candidate}
              size="sm"
              variant={locale === candidate ? 'primary' : 'secondary'}
              aria-pressed={locale === candidate}
              onClick={() => setLocale(candidate)}
            >
              {candidate.toUpperCase()}
            </Button>
          ))}
        </nav>
      </header>

      {alertVisible ? (
        <AlertBanner
          tone="info"
          dismissible
          dismissLabel={t('dismiss')}
          onDismiss={() => setAlertVisible(false)}
        >
          {t('service_ready')}
        </AlertBanner>
      ) : null}

      <main className="demo__main">
        <section className="demo__card" aria-labelledby="health-title">
          <Text as="h2" variant="label-md" id="health-title">
            {t('health_status')}
          </Text>
          <div className="demo__badges">
            <StatusBadge tone="success">{t('service_alive')}</StatusBadge>
            <StatusBadge tone="info">{t('service_ready')}</StatusBadge>
          </div>
        </section>

        <section className="demo__card" aria-labelledby="projects-title">
          <Text as="h2" variant="label-md" id="projects-title">
            {t('projects')}
          </Text>
          <div className="demo__badges">
            <StatusBadge tone="neutral">{t('draft')}</StatusBadge>
            <StatusBadge tone="success">{t('authorized')}</StatusBadge>
            <StatusBadge tone="neutral">{t('archived')}</StatusBadge>
          </div>
        </section>

        <section className="demo__card" aria-labelledby="documents-title">
          <Text as="h2" variant="label-md" id="documents-title">
            {t('documents')}
          </Text>
          <Button>{t('create')}</Button>
        </section>
      </main>
    </div>
  );
}
