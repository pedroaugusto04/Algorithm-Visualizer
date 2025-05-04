import { Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { CreateGraphStructureComponent } from './pages/create-graph-structure/create-graph-structure.component';
import { CreateMatrixStructureComponent } from './pages/create-matrix-structure/create-matrix-structure.component';
import { SeeGraphStructureComponent } from './pages/see-graph-structure/see-graph-structure.component';
import { ProfileComponent } from './pages/profile/profile.component';

export const routes: Routes = [
  {
    path: '',
    component: FullComponent,
    children: [
      {
        path: '',
        redirectTo: '/home',
        pathMatch: 'full',
      },
      {
        path: 'home',
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
