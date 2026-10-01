import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SecureStorageService {
  private storage:Map<string, any> = new Map()
  

  constructor() { }

   // Store a value in memory
  setItem(key: string, value: any): void {
    this.storage.set(key, value);
  }

  // Retrieve a value from memory
  getItem(key: string): any {
    return this.storage.get(key) || null;
  }

  // Remove a value
  removeItem(key: string): void {
    this.storage.delete(key);
  }

  // Clear all stored data
  clear(): void {
    this.storage.clear();
  }
}
