import { Component, OnInit, ElementRef, OnDestroy } from '@angular/core';
import { AuthenticationService } from 'src/app/shared/authentication.service';
import { DatasourceService} from '../../services/datasource.service';
import {FormBuilder, FormGroup, Validators, FormArray, FormControl} from "@angular/forms";
import {ActivatedRoute, Params, Router, ParamMap} from '@angular/router';
import { NgxLoadingSpinnerService } from '@k-adam/ngx-loading-spinner';
import swal from 'sweetalert2';

declare var $: any;

@Component({
    selector: 'app-validatecode-cmp',
    templateUrl: './validatecode.component.html'
})

export class ValidateCodeComponent implements OnInit, OnDestroy {
    test: Date = new Date();
    private toggleButton: any;
    private sidebarVisible: boolean;
    private nativeElement: Node;
    public logoURL;
    forgotForm: FormGroup;

    constructor(
        private element: ElementRef, 
        public authService: AuthenticationService,
        private data_api: DatasourceService,
        private formBuilder: FormBuilder,
        private spinnerService: NgxLoadingSpinnerService,
        private router: Router,
        private route: ActivatedRoute,
        ) {
        this.nativeElement = element.nativeElement;
        this.sidebarVisible = false;
    }

    ngOnInit() {
        this.getLogo();
        var navbar : HTMLElement = this.element.nativeElement;
        this.toggleButton = navbar.getElementsByClassName('navbar-toggle')[0];
        const body = document.getElementsByTagName('body')[0];
        body.classList.add('login-page');
        body.classList.add('off-canvas-sidebar');
        const card = document.getElementsByClassName('card')[0];
        setTimeout(function() {
            // after 1000 ms we add the class animated to the login/register card
            card.classList.remove('card-hidden');
        }, 700);

        this.forgotForm = this.formBuilder.group({
            email: ['',Validators.required],
            code: ['', Validators.required],
        }, {
        });

        this.route.queryParams
        .filter(params => params.email)
        .subscribe(params => {
            console.log(params.email);

            this.forgotForm.patchValue({
                email: params.email,
            });

        });


    }
    getLogo(){
        this.logoURL = this.data_api.getLogoURL();
    }

    get f(){
    return this.forgotForm.controls;
    }

    submit(){

        if (this.forgotForm.invalid) {

            swal.fire({
                title: 'The form is invalid.',
                // text: "You clicked the button!",
                buttonsStyling: false,
                customClass: {
                  confirmButton: 'btn btn-success',
                },
                icon: "error"
            })
            
            return;
        }


        this.spinnerService.show();

        this.data_api.validatePasswordCode(this.forgotForm.value)
        .subscribe(
          (result) => {
            console.log(result)
            if(result){
                this.spinnerService.hide();
                this.router.navigate(
                    ['/pages/reset-password'],
                    { queryParams: { email: this.forgotForm.value.email, code: this.forgotForm.value.code } }
                  );
            }
        },
        (error) => {
            console.log(error)
            swal.fire({
                title: error.error.message,
                // text: "You clicked the button!",
                buttonsStyling: false,
                customClass: {
                  confirmButton: 'btn btn-success',
                },
                icon: "error"
            })
            this.spinnerService.hide();
        }
        
      );
    }
    sidebarToggle() {
        var toggleButton = this.toggleButton;
        var body = document.getElementsByTagName('body')[0];
        var sidebar = document.getElementsByClassName('navbar-collapse')[0];
        if (this.sidebarVisible == false) {
            setTimeout(function() {
                toggleButton.classList.add('toggled');
            }, 500);
            body.classList.add('nav-open');
            this.sidebarVisible = true;
        } else {
            this.toggleButton.classList.remove('toggled');
            this.sidebarVisible = false;
            body.classList.remove('nav-open');
        }
    }
    ngOnDestroy(){
      const body = document.getElementsByTagName('body')[0];
      body.classList.remove('login-page');
      body.classList.remove('off-canvas-sidebar');
    }
}
