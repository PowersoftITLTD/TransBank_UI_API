import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {

  loader = signal<boolean>(false);
  private activeRequests = 0;

  showForRequest(): void {
    this.activeRequests += 1;
    this.loader.set(true);
  }

  hideForRequest(): void {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    this.loader.set(this.activeRequests > 0);
  }

}
