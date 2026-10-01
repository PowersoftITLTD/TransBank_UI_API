import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import { cloneDeep } from 'lodash';
import { userDetails } from '../../store/auth/auth.selectors';
import { BankDataService } from '../../core/services/bank-data.service';
import { AuthService } from '../../core/services/auth.service';
import { Alert, AlertKind, AlertDisplayType, AlertApiResponse } from '../../core/models/bank-account.model';


@Component({
  selector: 'app-alerts-page',
  standalone: true,
  template: `
    <div class="toolbar">
      <button class="chip" [class.active]="filter === 'all'" (click)="setFilter('all')">All <b>{{ alerts.length }}</b></button>
      <button class="chip" [class.active]="filter === 'break'" (click)="setFilter('break')">Breaks <b>{{ countFor('break') }}</b></button>
      <button class="chip" [class.active]="filter === 'feed'" (click)="setFilter('feed')">Feed health <b>{{ countFor('feed') }}</b></button>
      <button class="chip" [class.active]="filter === 'control'" (click)="setFilter('control')">Controls <b>{{ countFor('control') }}</b></button>
      <span class="spacer"></span>
      <button class="action">Mark all read</button>
    </div>

    @for (alert of filteredAlerts; track alert.id) {
      <article
        class="alert"
        [class.warn]="alert.type === 'warn'"
        [class.info]="alert.type === 'info'"
      >
        <div class="icon">{{ alert.type === 'info' ? 'i' : '!' }}</div>
        <div>
          <b>{{ alert.title }}</b>
          <p>{{ alert.description }}</p>
          <small>{{ alert.meta }}</small>
        </div>
      </article>
    }
  `,
  styles: [`
    .toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:14px}
    .chip,.action{border:1px solid #e1e7ed;border-radius:20px;background:white;padding:6px 11px;color:#4a5c6e;font-size:12px}
    .chip.active{background:#0a2b4c;color:white}
    .chip b{margin-left:4px}
    .spacer{flex:1}
    .action{border-radius:8px}
    .alert{display:flex;gap:12px;background:white;border:1px solid #e1e7ed;border-left:3px solid #c33c29;border-radius:10px;padding:14px;margin-bottom:10px}
    .alert.warn{border-left-color:#e0a93b}
    .alert.info{border-left-color:#00b5d8}
    .icon{width:30px;height:30px;flex:0 0 30px;display:grid;place-items:center;border-radius:8px;background:#fcece9;color:#c33c29;font-weight:700}
    .warn .icon{background:#fdf3e0;color:#b26b08}
    .info .icon{background:#e6f7fb;color:#0090ad}
    .alert b{font-size:13px}
    .alert p{font-size:12px;color:#4a5c6e;margin:3px 0}
    .alert small{font:10px monospace;color:#8494a4}
  `],
})
export class AlertsPageComponent implements OnInit {
  alerts: Alert[] = [];
 filter: AlertKind | 'all' = 'all';
  private readonly kindToDisplay: Record<AlertKind, AlertDisplayType> = {
    break: 'break',
    feed: 'warn',
    control: 'break',
    info: 'info',
  };

  constructor(
    private store: Store,
    private data: BankDataService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.store
      .select(userDetails)
      .pipe(take(1))
      .subscribe((user) => {
        this.alertsList();
        console.log('Check user: ', user);
      });
  }

  alertsList(): void {
    this.data.getSecureAPI('alerts/?includeResolved=true', true).subscribe({
      next: (alerts) => {
        const alertsList = cloneDeep(alerts.data);
        const ogAlerts: AlertApiResponse[] = JSON.parse(
          this.auth.decryptAES(alertsList)
        );

        this.alerts = (ogAlerts ?? []).map((a) => this.mapAlert(a));
        console.log('Mapped alerts: ', this.alerts);
      },
      error: (err) => console.error('alerts API failed', err),
    });
  }

  mapAlert(alert: AlertApiResponse): Alert {
    return {
      id: alert.Id,
      kind: alert.Kind,
      type: this.kindToDisplay[alert.Kind] ?? 'info',
      title: alert.Headline,
      description: alert.Detail,
      meta: alert.Meta,
      accountId: alert.AccountId,
      raisedAt: alert.RaisedAt,
      acknowledged: alert.Acknowledged,
    };
  }
  countFor(kind: AlertKind): number {
    return this.alerts.filter((alert) => alert.kind === kind).length;
  }

  get filteredAlerts(): Alert[] {
    return this.filter === 'all'
      ? this.alerts
      : this.alerts.filter((alert) => alert.kind === this.filter);
  }
  setFilter(filter: AlertKind | 'all'): void {
    this.filter = filter;
  }
}