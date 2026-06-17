import { Routes } from '@angular/router';
import { authGuard, adminGuard, organizerGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/auth/welcome/welcome.component').then(m => m.WelcomeComponent),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'events',
    loadComponent: () => import('./features/events/event-list/event-list.component').then(m => m.EventListComponent),
  },
  {
    path: 'events/new',
    canActivate: [authGuard, organizerGuard],
    loadComponent: () => import('./features/events/event-form/event-form.component').then(m => m.EventFormComponent),
  },
  {
    path: 'events/:id',
    loadComponent: () => import('./features/events/event-detail/event-detail.component').then(m => m.EventDetailComponent),
  },
  {
    path: 'events/:id/edit',
    canActivate: [authGuard, organizerGuard],
    loadComponent: () => import('./features/events/event-form/event-form.component').then(m => m.EventFormComponent),
  },
  {
    path: 'my-events',
    canActivate: [authGuard, organizerGuard],
    loadComponent: () => import('./features/events/my-events/my-events.component').then(m => m.MyEventsComponent),
  },
  {
    path: 'bookings',
    canActivate: [authGuard],
    loadComponent: () => import('./features/bookings/my-bookings/my-bookings.component').then(m => m.MyBookingsComponent),
  },
  {
    path: 'messages',
    canActivate: [authGuard],
    loadComponent: () => import('./features/messages/messages.component').then(m => m.MessagesComponent),
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
  },
  {
    path: 'admin/users',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./features/admin/user-list/user-list.component').then(m => m.UserListComponent),
  },
  {
    path: 'admin/users/:id',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./features/admin/user-detail/user-detail.component').then(m => m.UserDetailComponent),
  },
  { path: '**', redirectTo: '' },
];
