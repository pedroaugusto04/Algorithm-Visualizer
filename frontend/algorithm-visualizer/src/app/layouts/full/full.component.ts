import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatSidenav, MatSidenavContent } from '@angular/material/sidenav';
import { CoreService } from 'src/app/services/core.service';
import { filter } from 'rxjs/operators';
import { NavigationEnd, Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { TablerIconsModule } from 'angular-tabler-icons';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { AppNavItemComponent } from './sidebar/nav-item/nav-item.component';
import { NavItem } from './sidebar/nav-item/nav-item';
import { UserService } from 'src/app/services/user.service';
import { UserDTO } from 'src/app/models/DTO/User/UserDTO';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogModule, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { AnonymousAlertDialogComponent } from 'src/app/components/anonymous-alert-dialog/anonymous-alert-dialog.component';

const MOBILE_VIEW = 'screen and (max-width: 768px)';
const TABLET_VIEW = 'screen and (min-width: 769px) and (max-width: 1024px)';


@Component({
  selector: 'app-full',
  imports: [
    RouterModule,
    AppNavItemComponent,
    MaterialModule,
    CommonModule,
    SidebarComponent,
    NgScrollbarModule,
    TablerIconsModule,
    HeaderComponent,
    MatButtonModule,
    MatDialogModule,
  ],
  templateUrl: './full.component.html',
  styleUrls: [],
  encapsulation: ViewEncapsulation.None
})
export class FullComponent implements OnInit {

  @ViewChild('leftsidenav')
  public sidenav: MatSidenav;
  resView = false;
  @ViewChild('content', { static: true }) content!: MatSidenavContent;
  //get options from service
  options = this.settings.getOptions();
  private layoutChangesSubscription = Subscription.EMPTY;
  private isMobileScreen = false;
  private isContentWidthFixed = true;
  private isCollapsedWidthFixed = false;
  private htmlElement!: HTMLHtmlElement;
  private user: UserDTO;
  private navItemId: number = 0;

  navItems: NavItem[] = [];


  get isOver(): boolean {
    return this.isMobileScreen;
  }


  constructor(
    private settings: CoreService,
    private router: Router,
    private breakpointObserver: BreakpointObserver,
    private userService: UserService,
    private dialog: MatDialog
  ) {
    this.htmlElement = document.querySelector('html')!;
    this.layoutChangesSubscription = this.breakpointObserver
      .observe([MOBILE_VIEW, TABLET_VIEW])
      .subscribe((state) => {
        // SidenavOpened must be reset true when layout changes
        this.options.sidenavOpened = true;
        this.isMobileScreen = state.breakpoints[MOBILE_VIEW];
        if (this.options.sidenavCollapsed == false) {
          this.options.sidenavCollapsed = state.breakpoints[TABLET_VIEW];
        }
      });

    // Initialize project theme with options

    // This is for scroll to top
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((e) => {
        this.content.scrollTo({ top: 0 });
      });
  }


  ngOnInit(): void {
    this.userService.getUserLoggedIn().subscribe({
      next: (user) => {
        this.user = user;
        this.loadUserGraphs();
        this.loadUserMatrices();

        this.navItems = [
          {
            id: this.IncrementAndGetNavItemId(),
            navCap: 'Home',
          },
          {
            id: this.IncrementAndGetNavItemId(),
            displayName: 'Home',
            iconName: 'home',
            route: '/home',
          },
          {
            id: this.IncrementAndGetNavItemId(),
            navCap: 'Data Structures',
          },

          {
            id: this.IncrementAndGetNavItemId(),
            displayName: 'My Data Structures',
            iconName: 'chart-dots',
            children: [
              {
                id: this.IncrementAndGetNavItemId(),
                displayName: 'Graphs',
                iconName: 'git-merge',
                type: 'Graph',
                children: []
              },
              {
                id: this.IncrementAndGetNavItemId(),
                displayName: 'Matrices',
                iconName: 'border-all',
                type: 'Matrix',
                children: []
              },
            ],
            type: 'DataStructure'
          },
          {
            id: this.IncrementAndGetNavItemId(),
            displayName: 'Run Code',
            iconName: 'player-play',
            route: '/run-code',
          },
          {
            id: this.IncrementAndGetNavItemId(),
            displayName: 'Create Structure',
            iconName: 'apps',
            children: [
              {
                id: this.IncrementAndGetNavItemId(),
                displayName: 'Graph',
                iconName: 'git-merge',
                route: '/create-graph-structure',
              },
              {
                id: this.IncrementAndGetNavItemId(),
                displayName: 'Matrix',
                iconName: 'border-all',
                route: '/create-matrix-structure',
              }
            ]
          }
        ]
      },
      error: () => {
        this.navItems = [
          {
            id: this.IncrementAndGetNavItemId(),
            navCap: 'Home',
          },
          {
            id: this.IncrementAndGetNavItemId(),
            displayName: 'Home',
            iconName: 'home',
            route: '/home',
          },
          {
            id: this.IncrementAndGetNavItemId(),
            navCap: 'Data Structures',
          },
          {
            id: this.IncrementAndGetNavItemId(),
            displayName: 'Run Code',
            iconName: 'player-play',
            route: '/run-code',
          },
          {
            id: this.IncrementAndGetNavItemId(),
            displayName: 'Create Structure',
            iconName: 'apps',
            onClick: () => {
              this.alertAnonymousUser();
            },
            children: [
              {
                id: this.IncrementAndGetNavItemId(),
                displayName: 'Graph',
                iconName: 'git-merge',
                route: '/create-graph-structure',
              },
              {
                id: this.IncrementAndGetNavItemId(),
                displayName: 'Matrix',
                iconName: 'border-all',
                route: '/create-matrix-structure',
              }
            ]
          },
          {
            id: this.IncrementAndGetNavItemId(),
            navCap: 'Auth',
          },
          {
            id: this.IncrementAndGetNavItemId(),
            displayName: 'Login',
            iconName: 'login',
            route: '/authentication/login',
          },
          {
            id: this.IncrementAndGetNavItemId(),
            displayName: 'Register',
            iconName: 'user-plus',
            route: '/authentication/register',
          },
        ]
      }
    });
  }

  ngOnDestroy() {
    this.layoutChangesSubscription.unsubscribe();
  }

  toggleCollapsed() {
    this.isContentWidthFixed = false;
    this.options.sidenavCollapsed = !this.options.sidenavCollapsed;
    this.resetCollapsedState();
  }

  resetCollapsedState(timer = 400) {
    setTimeout(() => this.settings.setOptions(this.options), timer);
  }

  onSidenavClosedStart() {
    this.isContentWidthFixed = false;
  }

  onSidenavOpenedChange(isOpened: boolean) {
    this.isCollapsedWidthFixed = !this.isOver;
    this.options.sidenavOpened = isOpened;
    //this.settings.setOptions(this.options);
  }

  loadUserGraphs() {

    this.userService.loadUserGraphsIds().subscribe({
      next: (graphsIds) => {

        let graphBar;

        for (const item of this.navItems) {
          if (item.type === 'DataStructure') {
            graphBar = item.children?.find(child => child.displayName === 'Graphs');
          }
        }

        if (graphBar) {
          let countGraph: number = 1;
          graphsIds.forEach(graphId => {
            const item: NavItem = {
              id: this.IncrementAndGetNavItemId(),
              displayName: `Graph ${countGraph}`,
              iconName: "point",
              route: `/see-graph-structure/${graphId}`
            }
            graphBar.children.push(item);
            countGraph++;
          })
        }
      },
      error: () => {
      }
    });
  }


  loadUserMatrices() {

    /*this.userService.loadUserMatrices().subscribe({
      next:(matrices) => {
        matrixItem.children = matrices;
      },
      error:() => {

      }
    });*/
  }

  alertAnonymousUser() {

    this.router.navigate(['/create-graph-structure']); // apenas para visualizacao por parte do usuario

    this.dialog.open(AnonymousAlertDialogComponent, {
      width: '700px',
      height: '150px'
    });
  }

  onNavItemClick(item: NavItem): void {
    if (item.onClick) {
      item.onClick();
    }
  }

  IncrementAndGetNavItemId() {
    this.navItemId++;
    return this.navItemId;
  }

}
