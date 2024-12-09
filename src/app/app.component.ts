import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, NavigationStart, RouteConfigLoadStart, RouteConfigLoadEnd, RouterEvent} from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { NgxLoadingSpinnerService } from '@k-adam/ngx-loading-spinner';
import {MyService} from './services/image-upload-service'; 

@Component({
    selector: 'app-my-app',
    templateUrl: './app.component.html',
})

export class AppComponent implements OnInit {
  private _router: Subscription;
  routerLoading = false;
  message:string;

  constructor( private router: Router, private spinnerService: NgxLoadingSpinnerService, private myService: MyService ) {
    // console.log(this.message);
    router.events.subscribe(
      (event: RouterEvent): void => {
        if (event instanceof RouteConfigLoadStart) {
          this.routerLoading = true;
          this.spinnerService.show();
        } else if (event instanceof RouteConfigLoadEnd) {
          this.spinnerService.hide();
          this.routerLoading = false;
        }
      }
    );
  }

    ngOnInit() {
      this._router = this.router.events.filter(event => event instanceof NavigationEnd).subscribe((event: NavigationEnd) => {
        const body = document.getElementsByTagName('body')[0];
        const modalBackdrop = document.getElementsByClassName('modal-backdrop')[0];
        if (body.classList.contains('modal-open')) {
          body.classList.remove('modal-open');
          modalBackdrop.remove();
        }
      });

      this.myService.sharedMessage.subscribe(message => this.message = message)

    }
}
