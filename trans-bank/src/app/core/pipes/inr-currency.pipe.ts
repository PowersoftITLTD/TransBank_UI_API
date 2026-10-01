import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'inrCurrency', standalone: true })
export class InrCurrencyPipe implements PipeTransform {
  transform(value: number, unit: 'full' | 'lakh' | 'cr' = 'full'): string {
    const divisor = unit === 'cr' ? 10_000_000 : unit === 'lakh' ? 100_000 : 1;
    const suffix = unit === 'cr' ? ' Cr' : unit === 'lakh' ? ' L' : '';
    return `₹${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value / divisor)}${suffix}`;
  }
}
