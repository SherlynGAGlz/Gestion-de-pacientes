import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component')
        .then(m => m.LoginComponent)
  },

  {
    path: 'pacientes',
    loadComponent: () =>
      import('./components/pacientes/pacientes.component')
        .then(m => m.PacientesComponent),
    canActivate: [authGuard]
  },

  { path: '**', redirectTo: '/login' }
];