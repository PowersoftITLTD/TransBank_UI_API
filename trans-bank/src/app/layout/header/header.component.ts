import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="top">
      <div class="top-row">
        <div class="greet">
          <h1>Good afternoon, Hitesh</h1>
          <p>Positions as at 23 Mar 2026 · 3 entities · 6 accounts</p>
        </div>

        <div class="tools">
          <label class="search">
            <span>⌕</span>
            <input type="search"
                   placeholder="Search entity, project or account"
                   (input)="search.emit($any($event.target).value)">
          </label>
          <div class="sync"><i></i>Bank feed live · <span>15:48</span></div>
          <button class="button" (click)="refresh.emit()">⟳ Refresh</button>
          <button class="icon" aria-label="Notifications">♧</button>
          <div class="avatar">HG</div>
          <button class="button" type="button" (click)="this.session_logout()">Log out</button>
        </div>
      </div>

      <div class="tabs">
        <button
          [class.selected]="active === 'balance'"
          (click)="select('balance')">
          Balance cockpit
        </button>

        <button
          [class.selected]="active === 'alerts'"
          (click)="select('alerts')">
          Alerts <span class="badge">5</span>
        </button>
      </div>
    </header>
  `,
  styles: [`
    .top{background:white;border-bottom:1px solid #e1e7ed;padding:14px 22px 0;position:sticky;top:0;z-index:3}
    .top-row{display:flex;align-items:flex-start;gap:18px;flex-wrap:wrap}
    .greet{flex:1;min-width:200px}
    h1{font-size:20px;margin:0;font-weight:600;letter-spacing:-.02em}
    .greet p{margin:3px 0 0;color:#8494a4;font-size:12px}
    .tools{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .search{display:flex;gap:7px;align-items:center;background:#f4f6f8;border:1px solid #e1e7ed;border-radius:8px;padding:7px 10px;min-width:230px}
    .search input{border:0;background:transparent;outline:0;width:100%;font:inherit}
    .search span{color:#8494a4;font-size:18px}
    .sync,.button{border:1px solid #e1e7ed;border-radius:8px;padding:7px 10px;background:white;color:#4a5c6e;font-size:12px}
    .sync{display:flex;align-items:center;gap:7px}
    .sync i{height:7px;width:7px;background:#0e8a5f;border-radius:50%}
    .sync span{font-family:monospace}
    .button{cursor:pointer}
    .button:hover{border-color:#8494a4}
    .icon{height:34px;width:34px;border:0;border-radius:8px;background:transparent;color:#4a5c6e;font-size:17px;cursor:pointer}
    .icon:hover{background:#f4f6f8}
    .avatar{height:32px;width:32px;border-radius:50%;background:#0a2b4c;color:white;display:grid;place-items:center;font-size:12px}

    .tabs{display:flex;gap:5px;margin-top:14px}
    .tabs button{
      padding:9px 14px; border:0;
      border-bottom:2px solid transparent;
      background:transparent; color:#4a5c6e;
      cursor:pointer; font:inherit; white-space:nowrap;
      transition: color .2s ease, border-color .2s ease;
    }
    .tabs button:hover{ color:#0a2b4c; }
    .tabs button.selected{
      color:#0a2b4c;
      border-bottom-color:#00b5d8;
      font-weight:600;
    }
    .badge{background:#fcece9;color:#c33c29;border-radius:20px;padding:1px 6px;font-size:10px;margin-left:4px}
    @media(max-width:700px){.top{padding:12px}.tools{width:100%}.search{flex:1;min-width:190px}}
  `]
})
export class HeaderComponent {
  @Output() search   = new EventEmitter<string>();
  @Output() navigate = new EventEmitter<string>();
  @Output() refresh  = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  /** Driven by parent OR updated locally on click */
  @Input() active = 'balance';
  private router = inject(Router);

  select(tab: string) {
    if (this.active === tab) return;   // already selected → no-op
    this.active = tab;                 // highlight instantly
    this.navigate.emit(tab);           // notify parent → parent updates sidebar
  }

  session_logout(){
    this.logout.emit()
    this.router.navigate(['/login']);
  }
}
