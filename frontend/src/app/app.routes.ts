import { Routes } from '@angular/router';
import { Home } from './features/home/home';

export const routes: Routes = [
  { path: '', component: Home, title: 'Portfolio' },
  {
    path: 'travel/:id',
    loadComponent: () =>
      import('./features/travel-detail/travel-detail').then((m) => m.TravelDetailPage),
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.adminRoutes),
  },
  { path: '**', redirectTo: '' },
];
