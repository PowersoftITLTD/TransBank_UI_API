import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoaderService } from '../services/loader.service';

export const loadingInterceptor: HttpInterceptorFn = (request, next) => {
  const loader = inject(LoaderService);
  loader.showForRequest();

  return next(request).pipe(finalize(() => loader.hideForRequest()));
};
