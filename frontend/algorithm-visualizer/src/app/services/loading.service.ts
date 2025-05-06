import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class LoadingService {
  private activeRequests = 0;
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  private showDelay = 200; 
  private showTimeout: any = null;

  getLoadingState() {
    return this.isLoadingSubject.asObservable();
  }

  show() {
    this.activeRequests++;
    if (this.activeRequests === 1) {
      
      this.showTimeout = setTimeout(() => {
        if (this.activeRequests > 0) {
          this.isLoadingSubject.next(true);
        }
      }, this.showDelay);
    }
  }

  hide() {
    this.activeRequests = Math.max(this.activeRequests - 1, 0);

    if (this.activeRequests === 0) {
      clearTimeout(this.showTimeout); 
      this.showTimeout = null;
      this.isLoadingSubject.next(false); 
    }
  }
}
