import { NavItem } from './nav-item/nav-item';

export const navItems: NavItem[] = [
  {
    navCap: 'Home',
  },
  {
    displayName: 'Home',
    iconName: 'home',
    route: '/home',
  },
  {
    displayName: 'Create Data Structure',
    iconName: 'apps',
    route: '/create-structure',
  },
  {
    navCap: 'Auth',
  },
  {
    displayName: 'Login',
    iconName: 'login',
    route: '/authentication',
    children: [
      {
        displayName: 'Login',
        iconName: 'point',
        route: '/authentication/login',
      },
      {
        displayName: 'Side Login',
        iconName: 'point',
        external: true,
        chip: true,
        chipClass: 'bg-primary text-white', 
        chipContent: 'PRO',
        route: 'https://materialpro-angular-main.netlify.app/authentication/login',
      },
    ],
  },
  {
    displayName: 'Register',
    iconName: 'user-plus',
    route: '/authentication',
    children: [
      {
        displayName: 'Register',
        iconName: 'point',
        route: '/authentication/register',
      },
      {
        displayName: 'Side Register',
        iconName: 'point',
        external: true,
        chip: true,
        chipClass: 'bg-primary text-white',
        chipContent: 'PRO',
        route: 'https://materialpro-angular-main.netlify.app/authentication/side-register',
      },
    ],
  }
];
