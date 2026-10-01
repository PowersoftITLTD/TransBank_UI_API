import { Component, Input } from '@angular/core';

@Component({ selector: 'app-kpi-card', standalone: true, template: `
  <article class="kpi-card" [class]="'kpi-card ' + tone">
    <div class="label">{{ label }}</div><div class="value">{{ value }}</div><div class="hint">{{ hint }}</div>
  </article>`, styles: [`
    .kpi-card{background:#fff;border:1px solid #e1e7ed;border-top:2px solid #d7e0e8;border-radius:10px;padding:14px;min-width:0}
    .kpi-card.bank{border-top-color:#00b5d8}.kpi-card.book{border-top-color:#b26b08}.kpi-card.break{border-top-color:#c33c29}
    .label{color:#8494a4;text-transform:uppercase;letter-spacing:.07em;font-size:11px;font-weight:600}
    .value{font-size:20px;font-weight:600;margin:7px 0 2px;white-space:nowrap}.break .value{color:#c33c29}.hint{font-size:11.5px;color:#8494a4}
  `] })
export class KpiCardComponent {
  @Input() label = ''; @Input() value = ''; @Input() hint = ''; @Input() tone = '';
}
