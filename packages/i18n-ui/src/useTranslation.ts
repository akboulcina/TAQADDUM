import { useEffect, useState } from 'react';

import { getDirection, messages, type Locale, type MessageKey } from './i18n.js';

export function useTranslation(initialLocale: Locale = 'fr') {
  const [locale, setLocale] = useState<Locale>(initialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = getDirection(locale);
  }, [locale]);

  const t = (key: MessageKey): string => messages[locale][key] ?? messages.fr[key] ?? key;

  return {
    locale,
    setLocale,
    t,
    direction: getDirection(locale),
  };
}
