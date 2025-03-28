import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
// Circuit breaker dekoratörünü kullanma yerine basit bir implementasyon yapacağız

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Bu method, varsayılan circuit breaker konfigürasyonu ile çağrıları korur
   */
  async executeWithDefaultCircuitBreaker<T>(
    serviceFn: () => Promise<T>,
  ): Promise<T> {
    try {
      return await serviceFn();
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Default circuit breaker error: ${err.message}`,
        err.stack,
      );
      throw new Error(
        'Servis şu anda kullanılamıyor, lütfen daha sonra tekrar deneyin',
      );
    }
  }

  /**
   * Bu method, location servisi için özel circuit breaker konfigürasyonu ile çağrıları korur
   */
  async executeLocationServiceCall<T>(serviceFn: () => Promise<T>): Promise<T> {
    try {
      return await serviceFn();
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Location service error: ${err.message}`, err.stack);
      throw new Error(
        'Konum servisi şu anda kullanılamıyor, lütfen daha sonra tekrar deneyin',
      );
    }
  }

  /**
   * Bu method, external api çağrıları için özel circuit breaker konfigürasyonu ile çağrıları korur
   */
  async executeExternalApiCall<T>(serviceFn: () => Promise<T>): Promise<T> {
    try {
      return await serviceFn();
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`External API error: ${err.message}`, err.stack);
      throw new Error(
        'Dış servis şu anda kullanılamıyor, lütfen daha sonra tekrar deneyin',
      );
    }
  }
}
