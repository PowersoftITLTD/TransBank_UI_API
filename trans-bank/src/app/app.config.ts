import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { provideRouter, withHashLocation } from '@angular/router';
import { routes } from './app.routes';
import { provideStore } from '@ngrx/store';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ConfigService } from './core/services/config.service';
import { authReducer } from './store/auth/auth.reducer';
import { errorInterceptor, jwtInterceptor } from './core/interceptor/error.interceptor';
import { loadingInterceptor } from './core/interceptor/loading.interceptor';

// Factory that returns a function which returns a Promise
export function initializeConfig(configService: ConfigService) {
  return () => configService.loadConfig();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([jwtInterceptor, loadingInterceptor, errorInterceptor])),
    provideRouter(routes, withHashLocation()),
    providePrimeNG({
      theme: {
        preset: Aura
      }
    }),
    provideStore({ auth: authReducer }),

    {
      provide: APP_INITIALIZER,
      useFactory: initializeConfig,
      deps: [ConfigService],
      multi: true
    }
  ]
};
