import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'listbox', loadComponent: () => import('./listbox-demo/listbox-demo') },
  { path: 'grid', loadComponent: () => import('./grid-demo/grid-demo') },
  { path: '**', redirectTo: 'listbox' },
];
