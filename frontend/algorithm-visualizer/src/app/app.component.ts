import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingComponent } from './components/loading/loading.component';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, LoadingComponent],
    templateUrl: './app.component.html'
})
export class AppComponent {
  title = 'Algorithm Visualizer';
}
