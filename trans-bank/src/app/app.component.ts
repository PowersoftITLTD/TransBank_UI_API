// import { Component } from '@angular/core';
// import { AlertsPageComponent } from './features/alerts/alerts-page.component';
// import { BalancesPageComponent } from './features/balances/balances-page.component';
// import { HeaderComponent } from './layout/header/header.component';
// import { SidebarComponent } from './layout/sidebar/sidebar.component';

// @Component({ selector: 'app-root', standalone: true, imports: [HeaderComponent, SidebarComponent, BalancesPageComponent, AlertsPageComponent], template: `
//   <div class="app-shell"><app-sidebar (navigate)="navigate($event)"/><main class="main"><app-header [active]="page" (search)="query=$event" (navigate)="navigate($event)" (refresh)="refresh()"/><div class="content">
//     @if (page === 'balances') { <app-balances-page [searchTerm]="query" /> } @else { <app-alerts-page /> }
//   </div></main></div>
//   `, styles: [`
//     :host{display:block;min-height:100vh}.app-shell{display:flex;min-height:100vh}.main{display:flex;flex:1;min-width:0;flex-direction:column}.content{padding:18px 22px 40px;flex:1}@media(max-width:700px){.content{padding:14px 12px 30px}}
//   `] })
// export class AppComponent {
//   title = 'trans-bank'; page = 'balances'; query = '';
//   navigate(page: string): void { this.page = page; }
//   refresh(): void { /* The data source is local prototype data; live refresh can be connected when an API is available. */ }
// }


import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToasterContainerComponent } from './features/toaster-container/toaster-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToasterContainerComponent],
  template: `<app-toaster-container /><router-outlet />`,
})
export class AppComponent {}
