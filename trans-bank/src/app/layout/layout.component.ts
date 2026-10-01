import { Component, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { HeaderComponent } from '../layout/header/header.component';
import { SidebarComponent } from '../layout/sidebar/sidebar.component';
import { AuthService } from '../core/services/auth.service';
import { ConfigService } from '../core/services/config.service';
import { LoaderComponent } from '../shared/components/loader/loader.component';
import { LoaderService } from '../core/services/loader.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, LoaderComponent],
  template: `

     @if (ds.loader()) {
    <loader></loader>
  }
    <div class="app-shell">
      <app-sidebar (navigate)="navigate($event)" />
      <main class="main">
        <app-header
          [active]="active"
          (search)="search($event)"
          (navigate)="navigate($event)"
          (refresh)="refresh()"
          (logout)="logout()"
        />
        <div class="content side-bar-scroll">
          <router-outlet (activate)="onPageActivate($event)" />
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; }
    .app-shell { display: flex; min-height: 100vh; }
    .main { display: flex; flex: 1; min-width: 0; flex-direction: column; }
    .content { padding: 18px 22px 40px; flex: 1; }
    @media (max-width: 700px) {
      .content { padding: 14px 12px 30px; }
    }
  `],
})
export class LayoutComponent {
  active = 'balance';
  query = '';
  private activePage: { searchTerm?: string } | null = null;

   ds = inject(LoaderService);

  constructor(private router: Router, private authService: AuthService) {}

  logout(): void {
    this.authService.logout();
  }

  navigate(page: string): void {
    this.active = page;
    this.router.navigate([page]);
  }

  onPageActivate(page: unknown): void {
    this.activePage = page as { searchTerm?: string };
    this.applySearch();
  }

  search(value: string): void {
    this.query = value;
    this.applySearch();
  }

  private applySearch(): void {
    if (this.activePage && 'searchTerm' in this.activePage) {
      this.activePage.searchTerm = this.query;
    }
  }

  refresh(): void {
    // wire to API later
  }

  

}
