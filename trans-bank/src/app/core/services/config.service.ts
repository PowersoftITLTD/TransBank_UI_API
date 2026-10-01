import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private config: any;

  async loadConfig() {
    const res = await fetch('/config.json');
    this.config = await res.json();
  }

  get apiBaseUrl() {
    return this.config?.apiBaseUrl;
  }

  get encryptionKey() {
    return this.config?.encryptionKey;
  }
}
