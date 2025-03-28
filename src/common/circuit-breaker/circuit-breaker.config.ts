import { CircuitBreakerOptions } from 'nestjs-circuit-breaker';
import { Logger } from '@nestjs/common';

const defaultFallback = (...args: any[]) => {
  console.error('Circuit açık, servisler engellendi', args);
  throw new Error(
    'Servis şu anda kullanılamıyor, lütfen daha sonra tekrar deneyin',
  );
};

export const defaultCircuitBreakerOptions: CircuitBreakerOptions = {
  // circuit açılmadan önce izin verilen maksimum hata sayısı
  maxErrorsBeforeOpen: 3,

  // hataların sıfırlanması için geçmesi gereken süre (milisaniye)
  errorExpirationTimeInMilliseconds: 30000,

  // half open durumda izin verilen maksimum deneme sayısı
  maxAttemptsInHalfOpenState: 2,

  // circuit kontrolü için zaman aşımı (ms)
  circuitCheckTimeoutInMilliseconds: 5000,

  // circuit açıkken çağrılacak yedek fonksiyon
  fallbackFunction: defaultFallback,

  key: 'default-circuit-breaker',

  logger: new Logger('CircuitBreaker'),
};

// location servisi için özel konfigürasyon
export const locationServiceCircuitBreakerOptions: CircuitBreakerOptions = {
  ...defaultCircuitBreakerOptions,
  maxErrorsBeforeOpen: 5, // location servisi için daha yüksek tolerans
  key: 'location-service',
};

// external api çağrıları için daha sıkı kurallar
export const externalApiCircuitBreakerOptions: CircuitBreakerOptions = {
  ...defaultCircuitBreakerOptions,
  maxErrorsBeforeOpen: 2, // external api'lar için daha düşük tolerans
  errorExpirationTimeInMilliseconds: 60000, // daha uzun bekleme süresi
  key: 'external-api-service',
};
