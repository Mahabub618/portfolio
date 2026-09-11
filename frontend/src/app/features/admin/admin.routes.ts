import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth.guard';

export const adminRoutes: Routes = [
  {
    path: 'login',
    title: 'Sign in · Admin',
    loadComponent: () => import('./login').then((m) => m.AdminLoginPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./admin-shell').then((m) => m.AdminShell),
    children: [
      {
        path: '',
        title: 'Dashboard · Admin',
        loadComponent: () => import('./dashboard').then((m) => m.AdminDashboard),
      },
      {
        path: 'profile',
        title: 'Profile · Admin',
        loadComponent: () => import('./profile-editor').then((m) => m.ProfileEditor),
      },
      {
        path: 'projects',
        title: 'Projects · Admin',
        loadComponent: () => import('./collections').then((m) => m.ProjectsAdmin),
      },
      {
        path: 'education',
        title: 'Education · Admin',
        loadComponent: () => import('./collections').then((m) => m.EducationAdmin),
      },
      {
        path: 'achievements',
        title: 'Achievements · Admin',
        loadComponent: () => import('./collections').then((m) => m.AchievementsAdmin),
      },
      {
        path: 'activities',
        title: 'Activities · Admin',
        loadComponent: () => import('./collections').then((m) => m.ActivitiesAdmin),
      },
      {
        path: 'blogs',
        title: 'Travel blogs · Admin',
        loadComponent: () => import('./blogs-admin').then((m) => m.BlogsAdmin),
      },
      {
        path: 'blogs/:id',
        title: 'Blog editor · Admin',
        loadComponent: () => import('./blog-editor').then((m) => m.BlogEditor),
      },
      {
        path: 'security',
        title: 'Security · Admin',
        loadComponent: () => import('./security').then((m) => m.AdminSecurity),
      },
    ],
  },
];
