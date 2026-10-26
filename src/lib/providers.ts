import type { ProviderInfo } from './api';

/** Локальный способ входа — его нет в реестре внешних провайдеров. */
const LOCAL_PROVIDER_LABELS: Record<string, string> = {
  password: 'Пароль',
};

/** Человекочитаемое название способа входа по его slug. */
export function providerLabel(
  providers: ProviderInfo[],
  slug: string,
): string {
  return (
    LOCAL_PROVIDER_LABELS[slug] ??
    providers.find((provider) => provider.slug === slug)?.displayName ??
    slug
  );
}
