// import { Component, Input } from '@angular/core';
// import { AccountGroup, BankAccount } from '../../core/models/bank-account.model';
// import { BankDataService } from '../../core/services/bank-data.service';
// import { InrCurrencyPipe } from '../../core/pipes/inr-currency.pipe';
// import { AccountTableComponent } from '../../shared/components/account-table/account-table.component';
// import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
// import { AccountDrawerComponent } from './account-drawer.component';
// import { Store } from '@ngrx/store';
// import { debounceTime, take } from 'rxjs';
// import { userDetails } from '../../store/auth/auth.selectors';
// import cloneDeep from 'lodash/cloneDeep';
// import { AuthService } from '../../core/services/auth.service';

// @Component({
//   selector: 'app-balances-page', standalone: true, imports: [AccountTableComponent, KpiCardComponent, InrCurrencyPipe, AccountDrawerComponent], template: `
//   <section><div class="kpis">
//     <app-kpi-card label="Balance as per bank" [value]="bankTotal | inrCurrency:unit" [hint]="accounts.length + ' accounts · live feed'" tone="bank" />
//     <app-kpi-card label="Balance as per book" [value]="bookTotal | inrCurrency:unit" hint="NetSuite bank book" tone="book" />
//     <app-kpi-card label="Unexplained break" [value]="breakTotal | inrCurrency:unit" [hint]="breakCount + ' accounts to investigate'" tone="break" />
//     <app-kpi-card label="Funds in transit" [value]="transitTotal | inrCurrency:unit" hint="Cheques and deposits not cleared" />
//     <app-kpi-card label="Oldest reco date" value="12 Feb" hint="2 feeds stale beyond 7 days" />
//   </div>
//   <div class="toolbar"><button class="chip" [class.active]="filter==='all'" (click)="setFilter('all')">All accounts <b>{{ allAccounts.length }}</b></button><button class="chip" [class.active]="filter==='brk'" (click)="setFilter('brk')">Unexplained break <b>{{ count('brk') }}</b></button><button class="chip" [class.active]="filter==='expl'" (click)="setFilter('expl')">Explained by timing <b>{{ count('expl') }}</b></button><button class="chip" [class.active]="filter==='stale'" (click)="setFilter('stale')">Stale feed <b>{{ count('stale') }}</b></button><span class="spacer"></span>
//     <div class="seg"><button [class.active]="unit==='full'" (click)="unit='full'">₹</button><button [class.active]="unit==='lakh'" (click)="unit='lakh'">Lakhs</button><button [class.active]="unit==='cr'" (click)="unit='cr'">Crores</button></div><button class="action" (click)="expandAll = !expandAll">⌗ {{ expandAll ? 'Collapse all' : 'Expand all' }}</button><button class="action primary" (click)="exportCsv()">⇩ Export</button>
//   </div>
//   <app-account-table [groups]="visibleGroups" [unit]="unit" [expandAll]="expandAll" (accountSelected)="openDrawer($event)" />
//   </section>
//   <app-account-drawer [account]="selected" [unit]="unit" (closed)="closeDrawer()" />
//   `, styles: [`
//     .kpis{display:grid;grid-template-columns:repeat(5,minmax(150px,1fr));gap:12px;margin-bottom:16px}.toolbar{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px}.chip,.action,.seg{border:1px solid #e1e7ed;background:white;border-radius:20px;padding:6px 11px;font-size:12px;color:#4a5c6e;cursor:pointer}.chip b{font:11px monospace;opacity:.7;margin-left:5px}.chip.active{background:#0a2b4c;color:white;border-color:#0a2b4c}.spacer{flex:1}.seg{display:flex;padding:0;border-radius:8px;overflow:hidden}.seg button{border:0;border-right:1px solid #e1e7ed;padding:6px 10px;background:white;color:#4a5c6e;cursor:pointer}.seg button:last-child{border:0}.seg button.active{background:#e6f7fb;color:#0a2b4c;font-weight:600}.action{border-radius:8px}.action.primary{background:#0a2b4c;border-color:#0a2b4c;color:white}.scrim{position:fixed;inset:0;width:100vw;height:100vh;height:100dvh;background:#0a2b4c55;z-index:10000;display:flex;justify-content:flex-end;animation:scrimIn .2s ease both}.drawer{position:fixed;top:0;right:0;height:100%;width:min(430px,100%);background:white;box-shadow:-14px 0 40px #0b1b2b24;display:flex;flex-direction:column;animation:drawerIn .28s cubic-bezier(.32,.72,0,1) both}.drawer-head{padding:18px;border-bottom:1px solid #e1e7ed;display:flex;justify-content:space-between;gap:10px}.drawer-head h2{font-size:16px;margin:0}.drawer-head p{font:11px monospace;color:#8494a4;margin:4px 0 0}.close{font-size:24px;border:0;background:none;cursor:pointer;color:#8494a4}.drawer-body{padding:18px;overflow:auto}.drawer-body h3{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#8494a4;margin:18px 0 8px}.stat,.step{display:flex;justify-content:space-between;gap:12px;padding:10px 12px;border:1px solid #edf1f5;border-bottom:0;font-size:12px}.stat:last-of-type{border-bottom:1px solid #edf1f5}.stat span,.step span{color:#4a5c6e}.stat b,.step b{font-family:monospace;font-weight:500}.bridge{border:1px solid #e1e7ed;border-radius:8px;overflow:hidden;margin-bottom:16px}.step.total{background:#f7f9fb;font-weight:600;border-bottom:1px solid #edf1f5}@keyframes scrimIn{from{opacity:0}to{opacity:1}}@keyframes drawerIn{from{transform:translateX(100%)}to{transform:translateX(0)}}@media(max-width:1100px){.kpis{grid-template-columns:repeat(3,minmax(145px,1fr))}}@media(max-width:650px){.kpis{grid-template-columns:repeat(2,minmax(130px,1fr))}.toolbar .spacer{display:none}}
//   `]
// })
// export class BalancesPageComponent {
//   readonly allAccounts = this.data.getAccounts();
//   filter = 'all'; query = ''; unit: 'full' | 'lakh' | 'cr' = 'full'; selected: BankAccount | null = null; expandAll = true;
//   userDetails: { token: string; user: string } = { token: '', user: ''};

//   constructor(private data: BankDataService, private auth:AuthService, private store: Store) {
//    }

// ngOnInit() {


//     this.store
//       .select(userDetails)
//       .pipe(take(1))
//       .subscribe((user) => {

//         console.log('Check user: ', user)
//         this.getAccountStatement();
//       });

//   }
//   @Input() set searchTerm(value: string) { this.query = value; }
//   openDrawer(account: BankAccount): void { this.selected = account; }
//   closeDrawer(): void { this.selected = null; }
//   get accounts(): BankAccount[] { return this.visibleGroups.flatMap(group => group.accounts); }
//   get visibleGroups(): AccountGroup[] {
//     return this.data.getGroups().map(group => ({
//       ...group, accounts: group.accounts.filter(account => {
//         const text = `${account.entity} ${account.project} ${account.bank} ${account.accountNumber}`.toLowerCase();
//         const matchesQuery = text.includes(this.query.toLowerCase());
//         const matchesFilter = this.filter === 'all' || (this.filter === 'stale' ? account.feed !== 'live' : account.status === this.filter);
//         return matchesQuery && matchesFilter;
//       })
//     })).filter(group => group.accounts.length > 0);
//   }

//   get bankTotal(): number { return this.accounts.reduce((sum, a) => sum + a.bankBalance, 0); }
//   get bookTotal(): number { return this.accounts.reduce((sum, a) => sum + a.bookBalance, 0); }
//   get breakTotal(): number { return this.accounts.filter(a => a.status === 'brk').reduce((sum, a) => sum + Math.abs(a.variance), 0); }
//   get breakCount(): number { return this.accounts.filter(a => a.status === 'brk').length; }
//   get transitTotal(): number { return this.accounts.reduce((sum, a) => sum + a.fundsInTransit, 0); }
//   count(status: string): number { return this.allAccounts.filter(a => status === 'stale' ? a.feed !== 'live' : a.status === status).length; }
//   setFilter(filter: string): void { this.filter = filter; }
//   search(value: string): void { this.query = value; }
//   exportCsv(): void { const rows = [['Entity', 'Project', 'Bank', 'Account', 'Bank balance', 'Book balance', 'Variance'], ...this.accounts.map(a => [a.entity, a.project, a.bank, a.accountNumber, String(a.bankBalance), String(a.bookBalance), String(a.variance)])]; const csv = rows.map(row => row.map(cell => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n'); const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); link.download = 'bank-balances.csv'; link.click(); URL.revokeObjectURL(link.href); }
//   // getAccountStatement(){
//   //     this.data.getSecureAPI('balances', true).subscribe({
//   //       next:(bankStatement)=>{

//   //           const statements = cloneDeep(bankStatement.data)
//   //           const og_statement = JSON.parse(this.auth.decryptAES(statements));

//   //            const accounts = og_statement?.Accounts
//   //           // accounts.map((account:any)=>{
//   //           //   return account
//   //           // })
//   //           console.log('og_statement: ', accounts);
//   //       }
//   //     })
//   // }

//   getAccountStatement() {
//   this.data.getSecureAPI('balances', true).subscribe({
//     next: (bankStatement) => {
//       const statements = cloneDeep(bankStatement.data);
//       const og_statement = JSON.parse(this.auth.decryptAES(statements));

//       const accounts = og_statement?.Accounts ?? [];

//       // Map each raw account -> BankAccount
//       const mapped: BankAccount[] = accounts.map((account: any) => ({
//         id: account.Id,
//         entity: account.EntityName,
//         project: account.ProjectName,
//         bank: account.BankName,
//         accountNumber: account.AccountNumber,
//         feed:
//           account.FeedStatus === 'manual'
//             ? 'manual'
//             : account.FeedAgeMinutes > 1440
//               ? 'stale'
//               : 'live',
//         bankBalance: account.BankBalance,
//         statementBalance: account.StatementClosingBalance,
//         reconciliationDate: this.formatDate(account.LastRecoDate),
//         bookBalance: account.BookBalance,
//         variance: account.UnexplainedBreak,
//         status:
//           account.Status === 'matched'
//             ? 'clean'
//             : account.Status === 'timing'
//               ? 'expl'
//               : 'brk',
//         fundsInTransit: account.UnclearedFunds,
//       }));

//       // Group by entity + project
//       const grouped: AccountGroup[] = Object.values(
//         mapped.reduce<Record<string, AccountGroup>>((acc, item) => {
//           const key = `${item.entity}::${item.project}`;

//           (acc[key] ??= {
//             entity: item.entity,
//             project: item.project,
//             accounts: [],
//           }).accounts.push(item);

//           return acc;
//         }, {}),
//       );

//       this.accountGroups = grouped;

//       console.log('og_statement: ', accounts);
//       console.log('accountGroups: ', this.accountGroups);
//     },
//     error: (err) => console.error('balances API failed', err),
//   });
// }

// private formatDate(iso: string): string {
//   if (!iso) return '';
//   const d = new Date(iso);
//   if (Number.isNaN(d.getTime())) return iso;
//   const months = ['Jan','Feb','Mar','Apr','May','Jun',
//                   'Jul','Aug','Sep','Oct','Nov','Dec'];
//   return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
// }
// }


import { Component, Input, OnInit } from '@angular/core';
import { AccountGroup, BankAccount } from '../../core/models/bank-account.model';
import { BankDataService } from '../../core/services/bank-data.service';
import { InrCurrencyPipe } from '../../core/pipes/inr-currency.pipe';
import { AccountTableComponent } from '../../shared/components/account-table/account-table.component';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { AccountDrawerComponent } from './account-drawer.component';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import { userDetails } from '../../store/auth/auth.selectors';
import cloneDeep from 'lodash/cloneDeep';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-balances-page',
  standalone: true,
  imports: [
    AccountTableComponent,
    KpiCardComponent,
    InrCurrencyPipe,
    AccountDrawerComponent,
  ],
  template: `
  <section>
    <div class="kpis">
      <app-kpi-card
        label="Balance as per bank"
        [value]="bankTotal | inrCurrency:unit"
        [hint]="allAccounts.length + ' accounts · ' + count('stale') + ' stale'"
        tone="bank" />
      <app-kpi-card
        label="Balance as per book"
        [value]="bookTotal | inrCurrency:unit"
        hint="NetSuite bank book"
        tone="book" />
      <app-kpi-card
        label="Unexplained break"
        [value]="breakTotal | inrCurrency:unit"
        [hint]="breakCount + ' accounts to investigate'"
        tone="break" />
      <app-kpi-card
        label="Funds in transit"
        [value]="transitTotal | inrCurrency:unit"
        hint="Cheques and deposits not cleared" />
      <app-kpi-card
        label="Oldest reco date"
        [value]="oldestRecoDate"
        [hint]="count('stale') + ' feeds stale beyond 7 days'" />
    </div>

    <div class="toolbar">
      <button class="chip" [class.active]="filter==='all'" (click)="setFilter('all')">
        All accounts <b>{{ allAccounts.length }}</b>
      </button>
      <button class="chip" [class.active]="filter==='brk'" (click)="setFilter('brk')">
        Unexplained break <b>{{ count('brk') }}</b>
      </button>
      <button class="chip" [class.active]="filter==='expl'" (click)="setFilter('expl')">
        Explained by timing <b>{{ count('expl') }}</b>
      </button>
      <button class="chip" [class.active]="filter==='stale'" (click)="setFilter('stale')">
        Stale feed <b>{{ count('stale') }}</b>
      </button>

      <span class="spacer"></span>

      <div class="seg">
        <button [class.active]="unit==='full'" (click)="unit='full'">₹</button>
        <button [class.active]="unit==='lakh'" (click)="unit='lakh'">Lakhs</button>
        <button [class.active]="unit==='cr'" (click)="unit='cr'">Crores</button>
      </div>

      <button class="action" (click)="expandAll = !expandAll">
        ⌗ {{ expandAll ? 'Collapse all' : 'Expand all' }}
      </button>
      <button class="action primary" (click)="exportCsv()">⇩ Export</button>
    </div>

    <app-account-table
      [groups]="visibleGroups"
      [unit]="unit"
      [expandAll]="expandAll"
      (accountSelected)="openDrawer($event)" />
  </section>

  <app-account-drawer
    [account]="selected"
    [unit]="unit"
    (closed)="closeDrawer()" />
  `,
  styles: [`
    .kpis{display:grid;grid-template-columns:repeat(5,minmax(150px,1fr));gap:12px;margin-bottom:16px}
    .toolbar{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px}
    .chip,.action,.seg{border:1px solid #e1e7ed;background:white;border-radius:20px;padding:6px 11px;font-size:12px;color:#4a5c6e;cursor:pointer}
    .chip b{font:11px monospace;opacity:.7;margin-left:5px}
    .chip.active{background:#0a2b4c;color:white;border-color:#0a2b4c}
    .spacer{flex:1}
    .seg{display:flex;padding:0;border-radius:8px;overflow:hidden}
    .seg button{border:0;border-right:1px solid #e1e7ed;padding:6px 10px;background:white;color:#4a5c6e;cursor:pointer}
    .seg button:last-child{border:0}
    .seg button.active{background:#e6f7fb;color:#0a2b4c;font-weight:600}
    .action{border-radius:8px}
    .action.primary{background:#0a2b4c;border-color:#0a2b4c;color:white}
    .scrim{position:fixed;inset:0;width:100vw;height:100vh;height:100dvh;background:#0a2b4c55;z-index:10000;display:flex;justify-content:flex-end;animation:scrimIn .2s ease both}
    .drawer{position:fixed;top:0;right:0;height:100%;width:min(430px,100%);background:white;box-shadow:-14px 0 40px #0b1b2b24;display:flex;flex-direction:column;animation:drawerIn .28s cubic-bezier(.32,.72,0,1) both}
    .drawer-head{padding:18px;border-bottom:1px solid #e1e7ed;display:flex;justify-content:space-between;gap:10px}
    .drawer-head h2{font-size:16px;margin:0}
    .drawer-head p{font:11px monospace;color:#8494a4;margin:4px 0 0}
    .close{font-size:24px;border:0;background:none;cursor:pointer;color:#8494a4}
    .drawer-body{padding:18px;overflow:auto}
    .drawer-body h3{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#8494a4;margin:18px 0 8px}
    .stat,.step{display:flex;justify-content:space-between;gap:12px;padding:10px 12px;border:1px solid #edf1f5;border-bottom:0;font-size:12px}
    .stat:last-of-type{border-bottom:1px solid #edf1f5}
    .stat span,.step span{color:#4a5c6e}
    .stat b,.step b{font-family:monospace;font-weight:500}
    .bridge{border:1px solid #e1e7ed;border-radius:8px;overflow:hidden;margin-bottom:16px}
    .step.total{background:#f7f9fb;font-weight:600;border-bottom:1px solid #edf1f5}
    @keyframes scrimIn{from{opacity:0}to{opacity:1}}
    @keyframes drawerIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
    @media(max-width:1100px){.kpis{grid-template-columns:repeat(3,minmax(145px,1fr))}}
    @media(max-width:650px){.kpis{grid-template-columns:repeat(2,minmax(130px,1fr))}.toolbar .spacer{display:none}}
  `],
})
export class BalancesPageComponent implements OnInit {
  // ---- API-mapped data (single source of truth) ----
  accountGroups: AccountGroup[] = [];

  // ---- UI state ----
  filter: 'all' | 'brk' | 'expl' | 'stale' = 'all';
  query = '';
  unit: 'full' | 'lakh' | 'cr' = 'lakh';
  selected: BankAccount | null = null;
  expandAll = true;

  userDetails: { token: string; user: string } = { token: '', user: '' };

  constructor(
    private data: BankDataService,
    private auth: AuthService,
    private store: Store,
  ) {}

  ngOnInit(): void {
    this.store
      .select(userDetails)
      .pipe(take(1))
      .subscribe((user) => {
        this.getAccountStatement();
      });
  }

  @Input() set searchTerm(value: string) {
    this.query = value;
  }

  // ---------------------------------------------------------------
  // Data selectors (all derive from accountGroups)
  // ---------------------------------------------------------------

  /** Flattened list of every account, ignoring the current filter. */
  get allAccounts(): BankAccount[] {
    return this.accountGroups.flatMap((g) => g.accounts);
  }

  /** Groups filtered by the current search + chip filter. */
  get visibleGroups(): AccountGroup[] {
    return this.accountGroups
      .map((group) => ({
        ...group,
        accounts: group.accounts.filter((account) => {
          const text =
            `${account.entity} ${account.project} ${account.bank} ${account.accountNumber}`.toLowerCase();
          const matchesQuery = text.includes(this.query.toLowerCase());
          const matchesFilter =
            this.filter === 'all' ||
            (this.filter === 'stale'
              ? account.feed !== 'live'
              : account.status === this.filter);
          return matchesQuery && matchesFilter;
        }),
      }))
      .filter((group) => group.accounts.length > 0);
  }

  /** Flattened list of accounts that pass the current filter. */
  get accounts(): BankAccount[] {
    return this.visibleGroups.flatMap((group) => group.accounts);
  }

  // ---------------------------------------------------------------
  // KPI totals
  // ---------------------------------------------------------------

  get bankTotal(): number {
    return this.accounts.reduce((sum, a) => sum + a.bankBalance, 0);
  }

  get bookTotal(): number {
    return this.accounts.reduce((sum, a) => sum + a.bookBalance, 0);
  }

  get breakTotal(): number {
    return this.accounts
      .filter((a) => a.status === 'brk')
      .reduce((sum, a) => sum + Math.abs(a.variance), 0);
  }

  get breakCount(): number {
    return this.accounts.filter((a) => a.status === 'brk').length;
  }

  get transitTotal(): number {
    return this.accounts.reduce((sum, a) => sum + a.fundsInTransit, 0);
  }

  /** Earliest reconciliation date across all accounts, formatted "DD MMM". */
  get oldestRecoDate(): string {
    const dates = this.allAccounts
      .map((a) => new Date(a.reconciliationDate))
      .filter((d) => !Number.isNaN(d.getTime()));
    if (!dates.length) return '—';
    const min = new Date(Math.min(...dates.map((d) => d.getTime())));
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${String(min.getDate()).padStart(2, '0')} ${months[min.getMonth()]}`;
  }

  // ---------------------------------------------------------------
  // UI actions
  // ---------------------------------------------------------------

  openDrawer(account: BankAccount): void {
    this.selected = account;
  }

  closeDrawer(): void {
    this.selected = null;
  }

  setFilter(filter: 'all' | 'brk' | 'expl' | 'stale'): void {
    this.filter = filter;
  }

  search(value: string): void {
    this.query = value;
  }

  count(status: 'brk' | 'expl' | 'stale' | 'clean'): number {
    return this.allAccounts.filter((a) =>
      status === 'stale' ? a.feed !== 'live' : a.status === status,
    ).length;
  }

  exportCsv(): void {
    const rows: string[][] = [
      ['Entity', 'Project', 'Bank', 'Account', 'Bank balance', 'Book balance', 'Variance'],
      ...this.accounts.map((a) => [
        a.entity,
        a.project,
        a.bank,
        a.accountNumber,
        String(a.bankBalance),
        String(a.bookBalance),
        String(a.variance),
      ]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    link.download = 'bank-balances.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  // ---------------------------------------------------------------
  // API + mapping
  // ---------------------------------------------------------------

  getAccountStatement(): void {
    this.data.getSecureAPI('balances', true).subscribe({
      next: (bankStatement) => {
        const statements = cloneDeep(bankStatement.data);
        const og_statement = JSON.parse(this.auth.decryptAES(statements));

        const accounts: any[] = og_statement?.Accounts ?? [];

        const mapped: BankAccount[] = accounts.map((account: any) =>
          this.mapAccount(account),
        );

        this.accountGroups = this.groupAccounts(mapped);
      },
      error: (err) => console.error('balances API failed', err),
    });
  }

  /** One raw API account -> BankAccount. */
  private mapAccount(account: any): BankAccount {
    return {
      id: account.Id,
      entity: account.EntityName,
      project: account.ProjectName,
      bank: account.BankName,
      accountNumber: account.AccountNumber,
      feed:
        account.FeedStatus === 'manual'
          ? 'manual'
          : account.FeedAgeMinutes > 1440
            ? 'stale'
            : 'live',
      bankBalance: account.BankBalance,
      statementBalance: account.StatementClosingBalance,
      reconciliationDate: this.formatDate(account.LastRecoDate),
      bookBalance: account.BookBalance,
      variance: account.UnexplainedBreak,
      status:
        account.Status === 'matched'
          ? 'clean'
          : account.Status === 'timing'
            ? 'expl'
            : 'brk',
      fundsInTransit: account.UnclearedFunds,
    };
  }

  /** Group flat accounts by entity + project. */
  private groupAccounts(accounts: BankAccount[]): AccountGroup[] {
    const grouped = accounts.reduce<Record<string, AccountGroup>>((acc, item) => {
      const key = `${item.entity}::${item.project}`;
      (acc[key] ??= {
        entity: item.entity,
        project: item.project,
        accounts: [],
      }).accounts.push(item);
      return acc;
    }, {});

    return Object.values(grouped).sort(
      (a, b) =>
        a.entity.localeCompare(b.entity) || a.project.localeCompare(b.project),
    );
  }

  /** "2026-09-12" -> "12 Sep 2026". */
  private formatDate(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }
}

