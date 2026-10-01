import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="rail" aria-label="Main navigation">
      <div class="brand">A</div>

      <button
        class="rail-btn"
        [class.active]="activeRoute === 'balance'"
        aria-label="Balance"
        title="Balance"
        (click)="select('balance')">
        <span class="icon">⌁</span>
        <span class="tooltip">Balances</span>
      </button>

      <button
        class="rail-btn"
        [class.active]="activeRoute === 'alerts'"
        aria-label="Alerts"
        title="Alerts"
        (click)="select('alerts')">
        <span class="icon">♧</span>
        <span class="tooltip">Alerts</span>
      </button>

      <div class="spacer"></div>

      <button
        class="rail-btn"
        [class.active]="activeRoute === 'settings'"
        aria-label="Settings"
        title="Settings"
        (click)="select('settings')">
        <span class="icon">⚙</span>
        <span class="tooltip">Settings</span>
      </button>
    </nav>
  `,
  styles: [`
    .rail {
      position: sticky; top: 0; height: 100vh; width: 60px; flex: 0 0 60px;
      background: #0a2b4c; display: flex; align-items: center; flex-direction: column;
      gap: 5px; padding: 14px 0; z-index: 5;
      animation: slideIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
      transition: width 0.25s ease, flex-basis 0.25s ease, background 0.25s ease;
    }
    .rail:hover { background: #0c3157; }

    @keyframes slideIn {
      from { transform: translateX(-100%); opacity: 0; }
      to   { transform: translateX(0);     opacity: 1; }
    }

    .brand {
      width: 31px; height: 31px; border-radius: 9px; background: #00b5d8;
      color: #0a2b4c; font-weight: 800; font-size: 18px;
      display: grid; place-items: center; margin-bottom: 12px;
      animation: brandPop 0.5s 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) both;
      transition: transform 0.25s ease, box-shadow 0.25s ease;
    }
    .brand:hover {
      transform: scale(1.08) rotate(-4deg);
      box-shadow: 0 0 14px rgba(0, 181, 216, 0.55);
    }
    @keyframes brandPop {
      0%   { transform: scale(0); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }

    .rail-btn {
      position: relative; width: 40px; height: 40px; border: 0; border-radius: 9px;
      color: #9bb8cb; font-size: 19px; background: transparent; cursor: pointer;
      display: grid; place-items: center;
      transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
      animation: btnFadeIn 0.4s ease both;
    }
    .rail-btn:nth-of-type(1) { animation-delay: 0.25s; }
    .rail-btn:nth-of-type(2) { animation-delay: 0.32s; }
    .rail-btn:nth-of-type(3) { animation-delay: 0.39s; }

    @keyframes btnFadeIn {
      from { opacity: 0; transform: translateX(-12px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    .rail-btn .icon {
      display: inline-block;
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .rail-btn:hover {
      background: rgba(255, 255, 255, 0.09);
      color: #fff;
      transform: translateY(-1px);
    }
    .rail-btn:hover .icon { transform: scale(1.18); }
    .rail-btn:active      { transform: scale(0.94); }

    /* ✅ Active highlighting */
    .rail-btn.active {
      background: #00b5d8;
      color: #04283a;
      box-shadow: 0 4px 14px rgba(0, 181, 216, 0.4);
      animation: activePulse 0.4s ease;
    }
    .rail-btn.active::before {
      content: '';
      position: absolute;
      left: -14px; top: 50%;
      transform: translateY(-50%);
      width: 3px; height: 22px;
      border-radius: 0 3px 3px 0;
      background: #00b5d8;
      box-shadow: 0 0 8px #00b5d8;
      animation: indicatorIn 0.3s ease both;
    }
    @keyframes indicatorIn {
      from { height: 0;  opacity: 0; }
      to   { height: 22px; opacity: 1; }
    }
    @keyframes activePulse {
      0%   { transform: scale(0.9); }
      50%  { transform: scale(1.06); }
      100% { transform: scale(1); }
    }

    .tooltip {
      position: absolute; left: 49px; top: 9px;
      background: #0b1b2b; color: #fff;
      padding: 4px 8px; border-radius: 5px; font-size: 11px;
      white-space: nowrap; opacity: 0; transform: translateX(-6px);
      pointer-events: none;
      transition: opacity 0.18s ease, transform 0.18s ease;
      z-index: 8;
    }
    .rail-btn:hover .tooltip { opacity: 1; transform: translateX(0); }

    .spacer { flex: 1; }

    @media (max-width: 700px) {
      .rail { width: 50px; flex-basis: 50px; }
      .tooltip { display: none; }
    }
    @media (prefers-reduced-motion: reduce) {
      .rail, .rail-btn, .brand, .rail-btn.active::before {
        animation: none !important;
        transition: none !important;
      }
    }
  `]
})
export class SidebarComponent {
  @Output() navigate = new EventEmitter<string>();

  /** Currently highlighted route — updated on click, but can also be set from parent */
  @Input() activeRoute: string = 'balance';

  select(route: string) {
    if (this.activeRoute === route) return;
    this.activeRoute = route;
    this.navigate.emit(route);
  }
}