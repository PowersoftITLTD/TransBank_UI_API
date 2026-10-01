import {
  Component, EventEmitter, Input, Output,
  OnChanges, SimpleChanges, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreeTable, TreeTableModule } from 'primeng/treetable';
import { TreeNode } from 'primeng/api';
import { AccountGroup, BankAccount } from '../../../core/models/bank-account.model';
import { InrCurrencyPipe } from '../../../core/pipes/inr-currency.pipe';

@Component({
  selector: 'app-account-table',
  standalone: true,
  imports: [CommonModule, TreeTableModule, InrCurrencyPipe],

  template: `
    <div class="table-wrap">
      <p-treeTable
        #tt
        [value]="treeNodes"
        [scrollable]="true"
        scrollHeight="flex"
        styleClass="p-treetable-sm cockpit-table">

        <!-- ================= colgroup ================= -->
        <ng-template pTemplate="colgroup">
          <colgroup>
            <col style="width: 300px" />
            <ng-container *ngFor="let group of groupedColumns">
              <col *ngFor="let sub of group.subFields" [style.width.px]="sub.width || 130" />
            </ng-container>
          </colgroup>
        </ng-template>

        <!-- ================= header ================= -->
        <ng-template pTemplate="header">
          <!-- Group row -->
          <tr class="groups">
            <th rowspan="2" class="left g-name">{{ firstColumnHeader }}</th>
            <ng-container *ngFor="let group of groupedColumns">
              <th [attr.colspan]="group.subFields.length"
                  class="text-center"
                  [ngClass]="getGroupHeaderClass(group)">
                {{ group.header }}
              </th>
            </ng-container>
          </tr>
          <!-- Sub-header row -->
          <tr class="sub">
            <ng-container *ngFor="let group of groupedColumns">
              <ng-container *ngFor="let sub of group.subFields">
                <th class="text-center"
                    [ngClass]="getSubHeaderClass(sub)">
                  {{ sub.label }}
                  <small *ngIf="sub.sublabel">{{ sub.sublabel }}</small>
                </th>
              </ng-container>
            </ng-container>
          </tr>
        </ng-template>

        <!-- ================= body ================= -->
        <ng-template pTemplate="body" let-rowNode let-rowData="rowData">
          <tr [ttRow]="rowNode"
              [ngClass]="{
                'lvl0': rowData.kind === 'entity',
                'lvl1': rowData.kind === 'project',
                'acct': rowData.kind === 'account'
              }"
              (click)="onRowClick(rowNode, rowData)">

            <!-- ---------- First column ---------- -->
            <td class="left first-col">
              <div class="namecell"
                   [style.padding-left.px]="rowData.kind === 'project' ? 18 : (rowData.kind === 'account' ? 52 : 0)">
                <p-treeTableToggler
                  *ngIf="rowData.kind !== 'account'"
                  [rowNode]="rowNode">
                </p-treeTableToggler>

                <ng-container [ngSwitch]="rowData.kind">
                  <ng-container *ngSwitchCase="'entity'">
                    <span class="entity-name">{{ rowData.entity }}</span>
                  </ng-container>
                  <ng-container *ngSwitchCase="'project'">
                    <span class="project-name">{{ rowData.project }}</span>
                  </ng-container>
                  <ng-container *ngSwitchCase="'account'">
                    <span class="acctname">
                      <b>{{ rowData.account.bank }}</b>
                      <span>{{ rowData.account.accountNumber }}</span>
                    </span>
                  </ng-container>
                </ng-container>
              </div>
            </td>

            <!-- ---------- Dynamic grouped columns ---------- -->
            <ng-container *ngFor="let group of groupedColumns">
              <ng-container *ngFor="let sub of group.subFields">

                <td [ngClass]="getCellClass(sub, rowData)">

                  <!-- Info column → eye icon -->
                  <ng-container *ngIf="sub.field === 'info'; else valueCell">
                    <button class="eye"
                            type="button"
                            *ngIf="rowData.kind === 'account'"
                            aria-label="View account details">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </button>
                  </ng-container>

                  <!-- Value cell -->
                  <ng-template #valueCell>

                    <!-- Feed column -->
                    <ng-container *ngIf="sub.field === 'feed'; else normalCell">
                      <span class="feed" [ngClass]="cellValue(rowData, 'feed')">
                        <i></i>{{ feedLabel(cellValue(rowData, 'feed')) }}
                      </span>
                    </ng-container>

                    <ng-template #normalCell>

                      <!-- Rupee fields -->
                      <ng-container *ngIf="isRupeeField(sub.field); else plainValue">
                        <span class="num"
                              [ngClass]="amountClass(cellValue(rowData, sub.field))">
                          {{ cellValue(rowData, sub.field) | inrCurrency:unit }}
                        </span>
                      </ng-container>

                      <ng-template #plainValue>

                        <!-- Variance tag -->
                        <span class="tag"
                              *ngIf="sub.field === 'variance' && rowData.kind === 'account'; else plainText"
                              [ngClass]="rowData.account.status">
                          {{ statusLabel(rowData.account.status) }}
                          <ng-container *ngIf="rowData.account.status === 'brk' && cellValue(rowData, sub.field)">
                            {{ cellValue(rowData, sub.field) | inrCurrency:unit }}
                          </ng-container>
                        </span>

                        <ng-template #plainText>
                          <span class="num">{{ cellValue(rowData, sub.field) }}</span>
                        </ng-template>

                      </ng-template>
                    </ng-template>
                  </ng-template>

                </td>

              </ng-container>
            </ng-container>
          </tr>
        </ng-template>

        <!-- ================= footer ================= -->
        <ng-template pTemplate="footer">
          <tr>
            <td class="left">Total — {{ accountCount }} accounts</td>
            <ng-container *ngFor="let group of groupedColumns">
              <ng-container *ngFor="let sub of group.subFields">
                <td [ngClass]="{ 'text-right': sub.field !== 'info', 'num': isRupeeField(sub.field) }">
                  <ng-container [ngSwitch]="sub.field">
                    <ng-container *ngSwitchCase="'bankBalance'">
                      {{ totals.bank | inrCurrency:unit }}
                    </ng-container>
                    <ng-container *ngSwitchCase="'statementBalance'">
                      {{ totals.statement | inrCurrency:unit }}
                    </ng-container>
                    <ng-container *ngSwitchCase="'bookBalance'">
                      {{ totals.book | inrCurrency:unit }}
                    </ng-container>
                    <ng-container *ngSwitchCase="'variance'">
                      <span [ngClass]="amountClass(totals.variance)">
                        {{ totals.variance | inrCurrency:unit }}
                      </span>
                    </ng-container>
                  </ng-container>
                </td>
              </ng-container>
            </ng-container>
          </tr>
        </ng-template>

        <!-- ================= empty ================= -->
        <ng-template pTemplate="emptymessage">
          <tr>
            <td [attr.colspan]="totalColspan" class="text-center no-data" [style]="'text-align:center'">
              <b>No accounts match this view</b>
              <span>Clear the filter or search for another entity.</span>
            </td>
          </tr>
        </ng-template>

      </p-treeTable>
    </div>
  `,

  styles: [`
    /* ============================================================
     * Shell
     * ============================================================ */
    .table-wrap {
      background: #fff;
      border: 1px solid #e1e7ed;
      border-radius: 10px;
      box-shadow: 0 1px 2px rgba(11,27,43,.06), 0 8px 24px rgba(11,27,43,.06);
      overflow: hidden;
    }

    :host ::ng-deep .cockpit-table.p-treetable {
      font-size: 13.5px;
      font-family: 'IBM Plex Sans', Arial, sans-serif;
    }
    :host ::ng-deep .cockpit-table .p-treetable-table {
      min-width: 1020px;
    }

    /* ============================================================
     * Headers — group row + sub-header row
     * ============================================================ */
    :host ::ng-deep .cockpit-table thead th {
      padding: 9px 12px;
      color: #4a5c6e;
      background: #fafcfd;
      border-bottom: 1px solid #e1e7ed;
      font-weight: 600;
      white-space: nowrap;
      vertical-align: bottom;
    }

    :host ::ng-deep .cockpit-table thead th.left,
    :host ::ng-deep .cockpit-table tbody td.left,
    :host ::ng-deep .cockpit-table tfoot td.left { text-align: left; }

    /* Group header row */
    :host ::ng-deep .cockpit-table thead tr.groups th {
      text-align: center;
      text-transform: uppercase;
      letter-spacing: .09em;
      font-size: 10.5px;
      font-weight: 700;
      padding: 9px 12px;
      border-bottom: 1px solid #e1e7ed;
    }
    :host ::ng-deep .cockpit-table thead tr.groups th.g-name {
      background: #fff;
      border-bottom: 1px solid #e1e7ed;
    }

    /* Group themes */
    :host ::ng-deep .header-grey-cell-col-1 { background: #e6f7fb !important; color: #0090ad !important; }
    :host ::ng-deep .header-grey-cell-col-2 { background: #fdf3e0 !important; color: #b26b08 !important; }
    :host ::ng-deep .header-grey-cell-col-3 { background: #f1f4f7 !important; color: #4a5c6e !important; }
    :host ::ng-deep .header-grey-cell-col-4 { background: #fff    !important; color: #8494a4 !important; }

    /* Sub-header row */
    :host ::ng-deep .cockpit-table thead tr.sub th {
      font-size: 11px;
      font-weight: 600;
      color: #4a5c6e;
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid #e1e7ed;
      background: #fafcfd;
      vertical-align: bottom;
    }
    :host ::ng-deep .cockpit-table thead tr.sub th small {
      display: block;
      font-weight: 400;
      color: #8494a4;
      font-size: 10px;
      font-family: 'IBM Plex Mono', monospace;
      margin-top: 2px;
    }
    :host ::ng-deep .header-today  { color: #0e8a5f !important; }
    :host ::ng-deep .header-future { color: #b26b08 !important; }
    :host ::ng-deep .blue-theme    { color: #0090ad !important; }
    :host ::ng-deep .count-overdue { color: #c33c29 !important; }

    /* ============================================================
     * Body rows — 3 levels
     * ============================================================ */
    :host ::ng-deep .cockpit-table tbody td {
      padding: 9px 12px;
      border-bottom: 1px solid #edf1f5;
      text-align: center;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }

    :host ::ng-deep .cockpit-table tbody tr.lvl0 > td {
      background: #f7f9fb;
      font-weight: 600;
      color: #0a2b4c;
      border-bottom: 1px solid #e1e7ed;
      cursor: pointer;
    }
    :host ::ng-deep .cockpit-table tbody tr.lvl1 > td {
      background: #fcfdfe;
      color: #1c5484;
      font-weight: 500;
      cursor: pointer;
    }
    :host ::ng-deep .cockpit-table tbody tr.acct > td { cursor: pointer; }
    :host ::ng-deep .cockpit-table tbody tr.acct:hover > td { background: #fbfdfe; }

    /* ============================================================
     * First column
     * ============================================================ */
    .namecell {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 280px;
    }
    .entity-name  { font-weight: 600; font-size: 13px; }
    .project-name { font-weight: 500; font-size: 13px; }

    .acctname { display: flex; flex-direction: column; gap: 1px; }
    .acctname b { font-weight: 500; font-size: 13px; color: #0b1b2b; }
    .acctname span { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #8494a4; }

    /* ============================================================
     * Tree toggler — caret rotation fix
     * ============================================================ */
    :host ::ng-deep .cockpit-table .p-treetable-toggler {
      width: 16px !important;
      height: 16px !important;
      min-width: 16px !important;
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
      color: #8494a4 !important;
      background: transparent !important;
      border: none !important;
      padding: 0 !important;
      margin: 0 !important;
      transition: transform .15s ease;
      cursor: pointer;
    }
    :host ::ng-deep .cockpit-table .p-treetable-toggler:hover {
      color: #0090ad !important;
      background: transparent !important;
    }
    :host ::ng-deep .cockpit-table .p-treetable-toggler .p-tree-toggler-icon,
    :host ::ng-deep .cockpit-table .p-treetable-toggler .p-icon {
      width: 10px !important;
      height: 10px !important;
    }

    /* Rotate when expanded */
    :host ::ng-deep .cockpit-table .p-treetable-toggler.p-treetable-toggler-expanded,
    :host ::ng-deep .cockpit-table .p-treetable-toggler[aria-expanded="true"] {
      transform: rotate(90deg);
    }

    /* ============================================================
     * Cell content
     * ============================================================ */
    .num {
      font-family: 'IBM Plex Mono', monospace;
      font-variant-numeric: tabular-nums;
      letter-spacing: -.01em;
    }
    .pos  { color: #0b1b2b; }
    .neg  { color: #c33c29; }
    .zero { color: #8494a4; }

    /* Feed indicator */
    .feed {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      color: #4a5c6e;
      font-family: 'IBM Plex Sans', sans-serif;
      font-weight: 500;
      text-transform: capitalize;
    }
    .feed i {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #0e8a5f;
    }
    .feed.stale  i { background: #e0a93b; }
    .feed.manual i { background: #8494a4; }

    /* Reconciliation tag */
    .tag {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      font-weight: 600;
      border-radius: 5px;
      padding: 2px 7px;
      font-family: 'IBM Plex Sans', sans-serif;
    }
    .tag.clean { background: #e7f5ef; color: #0e8a5f; }
    .tag.expl  { background: #e6f7fb; color: #0090ad; }
    .tag.brk   { background: #fcece9; color: #c33c29; }

    /* Eye / detail button */
    .eye {
      background: none;
      border: none;
      cursor: pointer;
      color: #8494a4;
      padding: 0;
      display: inline-flex;
      align-items: center;
    }
    .eye:hover { color: #0090ad; }
    .eye svg { width: 15px; height: 15px; }

   

    /* ============================================================
     * Footer
     * ============================================================ */
    :host ::ng-deep .cockpit-table tfoot td {
      font-weight: 600;
      color: #0a2b4c;
      background: #f7f9fb;
      border-top: 1px solid #e1e7ed;
      padding: 11px 12px;
      text-align: right;
      font-family: 'IBM Plex Mono', monospace;
      font-variant-numeric: tabular-nums;
    }
    :host ::ng-deep .cockpit-table tfoot td.left {
      font-family: 'IBM Plex Sans', sans-serif;
      text-align: left;
    }

    /* ============================================================
     * Empty state
     * ============================================================ */
    .no-data {
      color: #8494a4;
      padding: 50px 20px !important;
      text-align: center;
    }
    .no-data b {
      display: block;
      color: #0b1b2b;
      font-size: 14px;
      margin-bottom: 4px;
      font-weight: 600;
    }
    .no-data span { font-size: 12.5px; }

    /* ============================================================
     * Utilities
     * ============================================================ */
    ::ng-deep.text-center { text-align: center; }
    .text-right  { text-align: right; }
    
  `]
})
export class AccountTableComponent implements OnChanges {

  @ViewChild('tt') tt!: TreeTable;

  /* ================= INPUTS ================= */

  @Input() groups: AccountGroup[] = [];
  @Input() unit: 'full' | 'lakh' | 'cr' = 'full';
  @Input() expandAll = false;

  /**
   * Column groups — must add up to the 8 columns in the prototype:
   *   1 (name, rowspan=2)
   * + 2 (Bank: Feed, Balance)
   * + 3 (NetSuite: Closing, Reco, Balance)
   * + 2 (Reconciliation: Variance, empty action)
   * = 8
   */
  @Input() groupedColumns: any[] = [
    {
      header: 'Bank details · live',
      fieldPrefix: 'bank_',
      subFields: [
        { label: 'Feed',                field: 'feed',         headerClass: 'l' },
        { label: 'Balance as per bank', field: 'bankBalance',  sublabel: 'refreshed 15:48' }
      ]
    },
    {
      header: 'NetSuite details',
      fieldPrefix: 'ns_',
      subFields: [
        { label: 'Closing balance', field: 'statementBalance', sublabel: 'bank statement' },
        { label: 'Reco date',       field: 'reconciliationDate' },
        { label: 'Balance',         field: 'bookBalance',       sublabel: 'bank book' }
      ]
    },
    {
      header: 'Reconciliation',
      fieldPrefix: 'reco_',
      subFields: [
        { label: 'Variance', field: 'variance' },
        { label: '',         field: 'info', width: 50 }
      ]
    }
  ];

  @Input() firstColumnHeader = 'Entity / Project / Account';

  /* ================= OUTPUTS ================= */

  @Output() accountSelected = new EventEmitter<BankAccount>();

  /* ================= TREE DATA ================= */

  treeNodes: TreeNode[] = [];

  private lastGroupsSignature = '';
  private lastExpandAll = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['groups'] || changes['expandAll']) {
      const signature = this.signatureOf(this.groups);

      // Only rebuild if something actually changed
      if (signature === this.lastGroupsSignature &&
          this.expandAll === this.lastExpandAll) {
        return;
      }
      this.lastGroupsSignature = signature;
      this.lastExpandAll = this.expandAll;
      this.treeNodes = this.buildTree();
    }
  }

  private signatureOf(groups: AccountGroup[]): string {
    return groups
      .map(g => `${g.entity}::${g.project}::${g.accounts.length}`)
      .join('|');
  }

  private buildTree(): TreeNode[] {
    // Group by entity so the entity row aggregates across all its projects
    const byEntity = new Map<string, AccountGroup[]>();
    for (const g of this.groups) {
      if (!byEntity.has(g.entity)) byEntity.set(g.entity, []);
      byEntity.get(g.entity)!.push(g);
    }

    const nodes: TreeNode[] = [];
    byEntity.forEach((projectGroups, entityName) => {
      const allAccounts = projectGroups.flatMap(g => g.accounts);
      const entityNode: TreeNode = {
        key: entityName,
        expanded: this.expandAll,
        data: { kind: 'entity', entity: entityName, accounts: allAccounts },
        children: projectGroups.map(g => ({
          key: `${g.entity}::${g.project}`,
          expanded: this.expandAll,
          data: {
            kind: 'project',
            entity: g.entity,
            project: g.project,
            accounts: g.accounts
          },
          children: g.accounts.map(a => ({
            key: `${g.entity}::${g.project}::${a.id}`,
            data: {
              kind: 'account',
              entity: g.entity,
              project: g.project,
              account: a
            },
            leaf: true
          }))
        }))
      };
      nodes.push(entityNode);
    });
    return nodes;
  }

  /* ================= Cell helpers ================= */

  cellValue(rowData: any, field: string): any {
    console.log('rowData: ', rowData)
    if (!field) return '';
    switch (rowData.kind) {
      case 'account': return rowData.account?.[field];
      case 'project':
      case 'entity':  return this.aggregate(rowData.accounts || [], field);
      default:        return '';
    }
  }

  private aggregate(accounts: BankAccount[], field: string): number | string {
    const numeric = ['bankBalance', 'statementBalance', 'bookBalance', 'variance', 'fundsInTransit'];
    if (!numeric.includes(field)) return '';
    return accounts.reduce((s, a) => s + ((a as any)[field] ?? 0), 0);
  }

  isRupeeField(field: string): boolean {
    return [
      'bankBalance', 'statementBalance', 'bookBalance',
      'variance', 'fundsInTransit',
      'closing_balance_as_per_bank_statement',
      'current_account_balance_as_per_bank_book',
      'balAvailable'
    ].includes(field);
  }

  getGroupHeaderClass(group: any): string {
    const h = (group.header || '').toLowerCase();
    if (h.includes('bank'))     return 'header-grey-cell-col-1';
    if (h.includes('netsuite')) return 'header-grey-cell-col-2';
    if (h.includes('recon'))    return 'header-grey-cell-col-3';
    return 'header-grey-cell-col-4';
  }

  getSubHeaderClass(sub: any): string {
    switch (sub.label?.trim()) {
      case 'Balance as per bank': return 'blue-theme';
      case 'Balance':             return 'blue-theme';
      case 'Reco date':           return 'header-future';
      case 'Closing balance':     return 'header-today';
      case 'Variance':            return 'count-overdue';
      default:                    return '';
    }
  }

  getCellClass(sub: any, rowData: any): any {
    return {
      'blue-theme-cell':   sub.field === 'bookBalance',
      'purple-theme-cell': sub.field === 'statementBalance',
      'yellow-theme-cell': sub.field === 'reconciliationDate',
      'Info':              sub.field === 'info',
      'text-right':        sub.field !== 'info',
      'icon-center':       sub.field === 'info'
    };
  }

  amountClass(amt: any): string {
    const n = Number(amt);
    if (!isFinite(n) || n === 0) return 'zero';
    return n < 0 ? 'neg' : 'pos';
  }

  feedLabel(feed: string): string {
    console.log('feedLabel: ', feed)
    switch (feed) {
      case 'live':   return 'Live';
      case 'stale':  return 'Stale';
      case 'manual': return 'Manual';
      default:  return feed || 'Live';
    }
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'brk':  return 'Break';
      case 'expl': return 'Timing';
      default:     return 'Matched';
    }
  }

  /* ================= Events ================= */

  onRowClick(rowNode: TreeNode, rowData: any): void {
    // Account row → emit selection
    if (rowData.kind === 'account' && rowData.account) {
      this.accountSelected.emit(rowData.account);
      return;
    }

    // Entity / project row → toggle expansion
    rowNode.expanded = !rowNode.expanded;
  }

  /* ================= Layout / totals ================= */

  get totalColspan(): number {
    return 1 + (this.groupedColumns?.reduce((a, g) => a + g.subFields.length, 0) || 0);
  }

  get accounts(): BankAccount[] {
    return this.groups.flatMap(g => g.accounts);
  }

  get accountCount(): number { return this.accounts.length; }

  get totals() {
    return this.accounts.reduce(
      (s, a) => ({
        bank:      s.bank      + (a.bankBalance      ?? 0),
        statement: s.statement + (a.statementBalance ?? 0),
        book:      s.book      + (a.bookBalance      ?? 0),
        variance:  s.variance  + (a.variance         ?? 0)
      }),
      { bank: 0, statement: 0, book: 0, variance: 0 }
    );
  }
}
