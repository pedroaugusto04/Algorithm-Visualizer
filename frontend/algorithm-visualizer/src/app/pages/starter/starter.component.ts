import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MaterialModule } from '../../material.module';
import { CanvasOverviewComponent } from 'src/app/components/canvas-overview/canvas-overview.component';
import { UserService } from 'src/app/services/user.service';


@Component({
  selector: 'app-starter',
  imports: [
    MaterialModule,
    CanvasOverviewComponent
  ],
  templateUrl: './starter.component.html',
  styleUrl: './starter.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class StarterComponent implements OnInit{

  ngOnInit(): void { 
    this.loadUserGraphs();
    this.loadUserMatrices();
  }

  constructor(private userService: UserService) {
    
  }

  loadUserGraphs() {

    this.userService.loadUserGraphs().subscribe({
      next:(graphs) => {
        console.log(graphs);
        //graphItem.children = graphs;
      },
      error:() => {
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
}