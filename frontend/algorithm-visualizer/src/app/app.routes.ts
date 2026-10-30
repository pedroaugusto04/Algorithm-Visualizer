import { Routes, Router, CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { CreateGraphStructureComponent } from './pages/create-graph-structure/create-graph-structure.component';
import { CreateMatrixStructureComponent } from './pages/create-matrix-structure/create-matrix-structure.component';
import { SeeGraphStructureComponent } from './pages/see-graph-structure/see-graph-structure.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { RunCodeComponent } from './components/run-code/run-code.component';

const hasShareHash = (): boolean => {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash;
  return hash.startsWith('#s=') || hash.startsWith('#run=') || hash.startsWith('#av-run=');
};

const redirectToRunCodeIfShared: CanActivateFn = () => {
  if (hasShareHash()) {
    const router = inject(Router);
    return router.parseUrl('/run-code' + window.location.hash);
  }
  return true;
};

export const routes: Routes = [
  {
    path: '',
    component: FullComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        canActivate: [() => {
          const router = inject(Router);
          if (hasShareHash()) {
            return router.parseUrl('/run-code' + window.location.hash);
          }
          return router.parseUrl('/home');
        }],
        children: [],
      },
      {
        path: 'home',
        canActivate: [redirectToRunCodeIfShared],
        loadChildren: () =>
          import('./pages/pages.routes').then((m) => m.PagesRoutes),
      },
      {
        path: 'see-graph-structure/:graphId',
        component: SeeGraphStructureComponent,
      },
      {
        path: 'create-graph-structure',
        component: CreateGraphStructureComponent, 
      },
      {
        path: 'run-code',
        component: RunCodeComponent,
      },
      {
        path: 'create-graph-structure/:graphId',
        component: CreateGraphStructureComponent,
      },
      {
        path: 'create-matrix-structure',
        component: CreateMatrixStructureComponent,
      },
      {
        path: 'profile',
        component: ProfileComponent,
      },
      
      {
        path: 'ui-components',
        loadChildren: () =>
          import('./pages/ui-components/ui-components.routes').then(
            (m) => m.UiComponentsRoutes
          ),
      },
      {
        path: 'extra',
        loadChildren: () =>
          import('./pages/extra/extra.routes').then((m) => m.ExtraRoutes),
      },
    ],
  },
  {
    path: '',
    component: BlankComponent,
    children: [
      {
        path: 'authentication',
        loadChildren: () =>
          import('./pages/authentication/authentication.routes').then(
            (m) => m.AuthenticationRoutes
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'authentication/error',
  },
];
