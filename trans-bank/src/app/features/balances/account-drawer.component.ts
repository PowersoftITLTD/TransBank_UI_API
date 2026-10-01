import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { BankAccount } from '../../core/models/bank-account.model';
import { InrCurrencyPipe } from '../../core/pipes/inr-currency.pipe';

@Component({
  selector: 'app-account-drawer',
  standalone: true,
  imports: [InrCurrencyPipe],
  template: `
    @if (account; as a) {
      <div class="account-drawer-backdrop" (click)="onBackdropClick($event)">
        <aside class="account-drawer-panel" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
          <header class="drawer-head">
            <div><h2 id="drawer-title">{{ a.project }}</h2><p>{{ a.bank }} · {{ a.accountNumber }}</p></div>
            <button type="button" class="account-drawer-close" aria-label="Close account details" (click)="requestClose($event)">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
            </button>
          </header>
          <div class="account-drawer-body">
            <section class="drawer-section">
              <h3>Account details</h3>
              <div class="stat-list">
                <div class="stat"><span>Unclear funds</span><b>{{ a.fundsInTransit | inrCurrency:unit }}</b></div>
                <div class="stat"><span>Net balance</span><b>{{ netBalance(a) | inrCurrency:unit }}</b></div>
                <div class="stat"><span>Overdraft limit</span><b>Not available</b></div>
                <div class="stat highlight"><span>Current balance</span><b>{{ a.bankBalance | inrCurrency:unit }}</b></div>
              </div>
            </section>
            <section class="drawer-section">
              <h3>Reconciliation bridge</h3>
              <div class="bridge">
                <div class="bridge-bar" aria-hidden="true"><i class="book-bar"></i><i class="timing-bar"></i><i class="break-bar"></i></div>
                <div class="step"><span class="operator"></span><span class="step-label">Balance as per bank, live</span><b>{{ a.bankBalance | inrCurrency:unit }}</b></div>
                <div class="step"><span class="operator">−</span><span class="step-label">Cheques issued, not presented</span><b>{{ 0 | inrCurrency:unit }}</b></div>
                <div class="step"><span class="operator">+</span><span class="step-label">Deposits in transit</span><b>{{ a.fundsInTransit | inrCurrency:unit }}</b></div>
                <div class="step rule"><span class="operator">=</span><span class="step-label">Expected book balance</span><b>{{ netBalance(a) | inrCurrency:unit }}</b></div>
                <div class="step"><span class="operator"></span><span class="step-label">Balance per NetSuite bank book</span><b>{{ a.bookBalance | inrCurrency:unit }}</b></div>
                <div class="step rule" [class.break-step]="a.status === 'brk'"><span class="operator">{{ a.status === 'brk' ? '!' : '✓' }}</span><span class="step-label">{{ a.status === 'brk' ? 'Unexplained break' : a.status === 'expl' ? 'Explained by timing' : 'Fully reconciled' }}</span><b>{{ a.variance | inrCurrency:unit }}</b></div>
                <div class="bridge-key"><span><i class="book-dot"></i>Book</span><span><i class="timing-dot"></i>Timing</span><span><i class="break-dot"></i>Break</span><span class="reco-date">Reco date {{ a.reconciliationDate }}</span></div>
              </div>
            </section>
            <section class="drawer-section">
              <h3>Latest statement lines</h3>
              <div class="statement-lines">
                @for (line of statementLines; track line.name) {
                  <div class="statement-line">
                    <span class="line-date">{{ line.date }}</span>
                    <span class="line-name"><b>{{ line.name }}</b><small>{{ line.note }}</small></span>
                    <span class="line-amount" [class.negative]="line.amount < 0">{{ line.amount | inrCurrency:unit }}<small [class.unmatched]="!line.matched">{{ line.matched ? 'MATCHED' : 'UNMATCHED' }}</small></span>
                  </div>
                }
              </div>
            </section>
            <div class="drawer-actions"><button type="button" class="action primary">View full statement</button><button type="button" class="action">Download statement</button></div>
          </div>
        </aside>
      </div>
    }
  `,
  styles: [` `]
})
export class AccountDrawerComponent {
  @Input() account: BankAccount | null = null;
  @Input() unit: 'full' | 'lakh' | 'cr' = 'full';
  @Output() closed = new EventEmitter<void>();

  readonly statementLines = [
    { date: '21 Mar', name: 'NEFT COLLECTION HDFC0000060', note: 'Matched to Customer Payment #CP-4412', amount: 420000, matched: true },
    { date: '20 Mar', name: 'RTGS INWARD SBIN0011513', note: 'Matched to Customer Payment #CP-4408', amount: -118500, matched: true },
    { date: '19 Mar', name: 'CHQ 004412 CLG', note: 'Matched to Customer Payment #CP-4399', amount: 1250000, matched: true },
    { date: '18 Mar', name: 'UPI/COLLECT/ANANDRAO', note: 'Not posted in NetSuite', amount: -74000, matched: false },
    { date: '17 Mar', name: 'IMPS/P2A/60321478', note: 'Matched to Customer Payment #CP-4381', amount: 300000, matched: true }
  ];

  netBalance(account: BankAccount): number {
    return account.bankBalance + account.fundsInTransit;
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closed.emit();
  }

  requestClose(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.closed.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.account) this.closed.emit();
  }
}
