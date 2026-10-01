// import { Routes } from '@angular/router';

// export const routes: Routes = [
// { path:'', pathMatch:'full', redirectTo:'login' },
//   {path:'login', loadComponent:()=>import('./login/login/login.component').then(m=>m.LoginComponent)},
//   { path:'balance',        loadComponent:()=>import('./features/balances/balances-page.component').then(m=>m.BalancesPageComponent) },
// ];


import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { authGuard, noAuthGuard } from './guard/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  {
    path: 'login',
    canActivate: [noAuthGuard],
    loadComponent: () =>
      import('./login/login/login.component').then(m => m.LoginComponent),
  },

  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'balance',
        canActivate:[authGuard],
        loadComponent: () =>
          import('./features/balances/balances-page.component')
            .then(m => m.BalancesPageComponent),
      },
      {
        path: 'alerts',
        canActivate:[authGuard],
        loadComponent: () =>
          import('./features/alerts/alerts-page.component')
            .then(m => m.AlertsPageComponent),
      },
    ],
  },

  // { path: '**', redirectTo: 'login' },
];
