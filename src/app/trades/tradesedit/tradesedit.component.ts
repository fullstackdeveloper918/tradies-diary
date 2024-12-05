import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, Inject} from '@angular/core';
import {DateAdapter, MAT_DATE_FORMATS} from '@angular/material/core';
import { AppDateAdapter, APP_DATE_FORMATS } from '../../services/format-datepicker';
import { DatasourceService } from '../../services/datasource.service';
import { PdfImage } from '../../services/pdf-image';
import { PreviewImage } from '../../services/preview-image';
import { Observable, Observer } from "rxjs";
import swal from 'sweetalert2';
// import * as Chartist from 'chartist';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Input } from '@angular/core';
//import * as $$ from 'jQuery';
import { NgxLoadingSpinnerService } from '@k-adam/ngx-loading-spinner';
import { AuthenticationService } from '../../shared/authentication.service';
import {FormBuilder, FormGroup, Validators, FormArray, FormControl} from "@angular/forms";
import { DatePipe } from '@angular/common';
import { MatChipInputEvent} from '@angular/material/chips';
import {ActivatedRoute, Params, Router} from '@angular/router';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs;
import {ENTER, COMMA} from '@angular/cdk/keycodes';
// import {NgxImageCompressService} from 'ngx-image-compress';
import {countries} from '../../services/country-data-store'
import { RoleChecker } from '../../services/role-checker.service';
import imageCompression from 'browser-image-compression';
import { ReplaySubject, Subject } from 'rxjs';
import { first ,take, takeUntil, startWith } from 'rxjs/operators';
import { MatSelect } from '@angular/material/select';
import * as moment from 'moment';

declare const $: any;

@Component({
  selector: 'app-tradessedit',
  templateUrl: './tradesedit.component.html',
  providers: [
    {provide: DateAdapter, useClass: AppDateAdapter},
    {provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS},
    DatePipe
  ]
})
export class TradesEditComponent implements OnInit {

    public passID: any;
    addFestForm: FormGroup;
    public listCostCentres= [];
    agentData;
    public userDetails;
    prevdata;

    breaktimes=[
        {value: '00:00', viewValue: 'No Breaks'},
        {value: '00:15', viewValue: '15 minutes'},
        {value: '00:30', viewValue: '30 minutes'},
        {value: '00:45', viewValue: '45 minute'},
        {value: '01:00', viewValue: '1 hour'},
    ]

    adminData;

    colorBtnDefault;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private data_api: DatasourceService,
        private spinnerService: NgxLoadingSpinnerService,
        public authService: AuthenticationService,
        private formBuilder: FormBuilder,
        public pdfImage: PdfImage,
        private previewImage: PreviewImage,
        public datepipe: DatePipe,
        private rolechecker: RoleChecker,
        public dialog: MatDialog,
        // private imageCompress: NgxImageCompressService
        ) { }
    
    ngOnInit() {
        this.getAdminSettings();
        this.passID = {
            id: this.route.snapshot.params['id'],
        };
        this.route.params

        .subscribe(
            (params: Params) => {
                this.passID.id = params['id'];
            }
        );

        if (localStorage.getItem('currentUser')) {
            this.userDetails = JSON.parse(localStorage.getItem('currentUser'));
        }

        this.addFestForm = this.formBuilder.group({
            tradeCompanyName: ['', Validators.required],
            trade: [''],
            tradeName: [''],
            tradeEmail: [''],
            tradePhone: [''],
            tradedefaultCostcode: [''],
            staffFormArray: this.formBuilder.array([ this.createStaffForm() ]),
        });
          this.getFBTrade();
          this.getFBCostcentres();

    }

    getAdminSettings(){
        this.data_api.getFBAdminSettings().subscribe((data) => {
            console.log(data);
            this.adminData = data;
            this.colorBtnDefault = data.colourEnabledButton ? data.colourEnabledButton : '';
        }); 
    }

    onButtonEnter(hoverName: HTMLElement) {
      hoverName.style.backgroundColor = this.adminData.colourHoveredButton ?  this.adminData.colourHoveredButton: '';
      console.log(hoverName);
    }

    onButtonOut(hoverName: HTMLElement) {
        hoverName.style.backgroundColor = this.adminData.colourEnabledButton ?  this.adminData.colourEnabledButton: '';
    }

    public getFBCostcentres(): void {
      this.data_api.getFBCostcentres().subscribe(data => {
          if(data){
            if(data.costcentreArray){
                data.costcentreArray.forEach(data =>{ 
                    this.listCostCentres.push(data)
                })
            }
          }
      });
    }

    openAddCostCentresDialog(): void {
      const dialogRef = this.dialog.open(CostcentresAddDialogEdit, {
          width: '400px',
          // data: this.renderValue
      });

      dialogRef.afterClosed().subscribe(result => {
          console.log(result);
          if(result){   
              this.getFBCostcentres();
              this.addFestForm.patchValue({
                defaultCostcode: result.toString()
              });
          }
      });
  }

      staffFormArray(): FormArray {
        return this.addFestForm.get("staffFormArray") as FormArray
      }
  
      addStaffForm(): void {
        // this.staffFormArray = this.editForm.get('staffFormArray') as FormArray;
        this.staffFormArray().push(this.createStaffForm());
      }
  
      removeStaffForm(i): void {
        // this.staffFormArray = this.editForm.get('staffFormArray') as FormArray;
        this.staffFormArray().removeAt(i)
      }
  
      duplicateStaffForm(i): void {
        // this.staffFormArray = this.editForm.get('staffFormArray') as FormArray;
  
          this.staffFormArray().push(this.createStaffForm());
  
          let len = (this.staffFormArray().length - 1)
  
          this.staffFormArray().at(len).get('start').patchValue(this.staffFormArray().at(i).get('start').value);
          this.staffFormArray().at(len).get('break').patchValue(this.staffFormArray().at(i).get('break').value);
          this.staffFormArray().at(len).get('finish').patchValue(this.staffFormArray().at(i).get('finish').value);
  
      }
  
      public  createStaffForm(): FormGroup {
        return this.formBuilder.group({
            staffID: Math.random().toString(36).substr(2, 9),
            staffName: '',
            start: '',
            break: '',
            finish: '',
        });
      }

      public onTradeWorkerName(){
          this.staffFormArray().at(0).get('staffName').patchValue(this.addFestForm.value.tradeName);
      }
      
      // public addLog(){

      //       let today = new Date();
      //       let passData = {
      //           todaysDate: today,
      //           log: 'Updated a Trade Global List',
      //           method: 'update',
      //           subject: 'trade',
      //           subjectID: this.passID.id,
      //           prevdata: this.prevdata,
      //           data: this.addFestForm.value,
      //           url: window.location.href
      //       }
            
      //       this.data_api.addActivityLog(this.userDetails.user_id,passData)
      //         .subscribe(
      //           (result) => {
      //             console.log(result);
      //             // this.dialogRef.close('success');
                  
      //             this.router.navigate(['/trades']);

      //           }
      //       ); 
      // }

      public addLog(){
          let today = new Date();
          let passData = {
              todaysDate: today,
              log: 'Updated a Trade - Global List',
              method: 'update',
              subject: 'trade',
              subjectID: this.passID.id,
              prevdata: this.prevdata,
              data: this.addFestForm.value,
              url: window.location.href,
              userID: this.userDetails.user_id,
              userName: this.userDetails.name
          }
          this.data_api.addFBActivityLog(passData).then(() => {
            this.spinnerService.hide();
            this.router.navigate(['/trades']);
          });
      }

      updateFBTrades(): void {

        if (this.addFestForm.invalid) {
  
          swal.fire({
              title: "Please fill required fields!",
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
  
        console.log(this.addFestForm.value);
        this.data_api.updateFBTrades(this.passID.id, this.addFestForm.value).then(() => {
            console.log('Updated item successfully!');
            // this.spinnerService.hide();
            // this.router.navigate(['/trades']);
            this.addLog();
            $.notify({
              icon: 'notifications',
              message: 'New Trades Updated'
            }, {
                type: 'success',
                timer: 1000,
                placement: {
                    from: 'top',
                    align: 'center'
                },
                template: '<div data-notify="container" class="col-xs-11 col-sm-3 alert alert-{0} alert-with-icon" role="alert">' +
                  '<button mat-button type="button" aria-hidden="true" class="close" data-notify="dismiss">  <i class="material-icons">close</i></button>' +
                  '<i class="material-icons" data-notify="icon">notifications</i> ' +
                  '<span data-notify="title">{1}</span> ' +
                  '<span data-notify="message">{2}</span>' +
                  '<div class="progress" data-notify="progressbar">' +
                    '<div class="progress-bar progress-bar-{0}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>' +
                  '</div>' +
                  '<a href="{3}" target="{4}" data-notify="url"></a>' +
                '</div>'
            });
            
          });
    }

      // public updateTrade() {

      //   if (this.addFestForm.invalid) {
      //     alert('invalid');
      //     return;
      //   }
    
      //   console.log(this.addFestForm.value);
  
      //   this.spinnerService.show();
  
      //   this.data_api.updateTrade(this.passID.id, this.addFestForm.value)
      //       .subscribe(
      //         (result) => {
      //             console.log(result);
      //           if(result){
  
      //               swal.fire({
      //                   title: "Trade Updated",
      //                   // text: "You clicked the button!",
      //                   buttonsStyling: false,
      //                   customClass: {
      //                     confirmButton: 'btn btn-success',
      //                   },
      //                   icon: "success"
      //               })

      //               this.addLog();
                    
      //               this.spinnerService.hide();

      //           }else{
      //             swal.fire({
      //                 title: "Error in Updating Trade",
      //                 // text: "You clicked the button!",
      //                 buttonsStyling: false,
      //                 customClass: {
      //                   confirmButton: 'btn btn-success',
      //                 },
      //                 icon: "error"
      //             })
  
      //           }
      //       },
      //       (error) => {
      //           console.log(error)
      //           swal.fire({
      //               title: error.error.message,
      //               // text: "You clicked the button!",
      //               buttonsStyling: false,
      //               customClass: {
      //                 confirmButton: 'btn btn-success',
      //               },
      //               icon: "error"
      //           })
                
      //       }
            
      //     );   
  
      // }
  
      public getFBTrade(){
        this.spinnerService.show();
        this.data_api.getFBTrade(this.passID.id).pipe(first()).subscribe(data => {
                console.log(data);
                this.agentData = data;
                this.addFestForm.patchValue({
                    tradeCompanyName: this.agentData.tradeCompanyName,
                    trade: this.agentData.trade,
                    tradeName: this.agentData.tradeName,
                    tradeEmail: this.agentData.tradeEmail,
                    tradePhone: this.agentData.tradePhone,
                    tradedefaultCostcode: this.agentData.tradedefaultCostcode,
                });

                if (this.agentData.staffFormArray){
                    this.staffFormArray().clear()
                    let i = 0;
                    this.agentData.staffFormArray.forEach(t => {

                      var teacher: FormGroup = this.createStaffForm();
                      this.staffFormArray().push(teacher);

                      i++;
                    });
                    this.staffFormArray().patchValue(this.agentData.staffFormArray);

                  }

                  this.prevdata = this.addFestForm.value;

                this.spinnerService.hide();
          }
        );
      }

      public changeTimeDialog(control, empIndex, data): void {
        const dialogRef = this.dialog.open(ChangeTimeDialogEdit, {
            width: '320px',
            data: data
        });
  
        dialogRef.afterClosed().subscribe(result => {
  
            console.log(result);
  
            if(result){  
  
              this.staffFormArray().at(empIndex).get(control).patchValue(result);
  
                // if(control == 'start'){
  
                //   this.addFestForm.patchValue({
                //     start: result,
                // });
                // }else if(control == 'finish'){
  
                //   this.addFestForm.patchValue({
                //     finish: result,
                //   });
  
                // }
  
  
            }
        });
      
    }
}

@Component({
  selector: 'changetime-adddialog',
  templateUrl: 'changetime-adddialog.html',
})

  export class ChangeTimeDialogEdit implements OnInit {
  
    addFestForm: FormGroup;
    mytime;

    constructor(
      private formBuilder: FormBuilder,
      public dialogRef: MatDialogRef<ChangeTimeDialogEdit>,
      private data_api: DatasourceService,
      private spinnerService: NgxLoadingSpinnerService,
      @Inject(MAT_DIALOG_DATA) public data) {}
  
    onNoClick(): void {
      this.dialogRef.close();
    }
  
    get g(){
      return this.addFestForm.controls;
    }
    
    public setTime() {
        console.log(moment(this.mytime).format('hh:mm A'));
        this.dialogRef.close(moment(this.mytime).format('hh:mm A'));
    }
  
    ngOnInit() {
      console.log(this.data)
      let t = this.data; 
      let cdt = moment(t, 'hh:mm A');
      console.log(cdt.format('YYYY-MM-DD HH:mm'));
      this.mytime = cdt.format('YYYY-MM-DD HH:mm');
    }
    

}


@Component({
  selector: 'costcentres-adddialog',
  templateUrl: 'costcentres-adddialog.html',
})

export class CostcentresAddDialogEdit implements OnInit {

  addFestForm: FormGroup;
  userDetails;

  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<CostcentresAddDialogEdit>,
    private data_api: DatasourceService,
    private spinnerService: NgxLoadingSpinnerService,
    @Inject(MAT_DIALOG_DATA) public data) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  get g(){
    return this.addFestForm.controls;
  }
  
  public addNewCostcentre() {

   
      if (this.addFestForm.invalid) {
        alert('invalid');
        return;
      }

      console.log(this.addFestForm.value);
      
      this.spinnerService.show();

      // let agentData = {
      //     "name": this.addFestForm.value.firstName,
      // };

      this.data_api.addCostcentre(this.addFestForm.value)
      .subscribe(
        (result) => {
          if(result){

              swal.fire({
                  title: "New Cost Centre Created!",
                  // text: "You clicked the button!",
                  buttonsStyling: false,
                  customClass: {
                    confirmButton: 'btn btn-success',
                  },
                  icon: "success"
              })

              this.addCostLog(result)
              
              this.spinnerService.hide();

          }else{

            swal.fire({
                title: "Error in Creating New Cost Centre",
                // text: "You clicked the button!",
                buttonsStyling: false,
                customClass: {
                  confirmButton: 'btn btn-success',
                },
                icon: "error"
            })

            this.spinnerService.hide();

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
          
      }
      
    );  
  }

  public addCostLog(id){
    // let newDetails;
    // newDetails += 'Company:';

    let today = new Date();
    let passData = {
        todaysDate: today,
        log: 'Created New Cost Centre - Global List',
        method: 'create',
        subject: 'costcentre',
        subjectID: id,
        data: this.addFestForm.value,
        url: window.location.href
    }
    
    this.data_api.addActivityLog(this.userDetails.user_id,passData)
      .subscribe(
        (result) => {
          console.log(result);
          this.dialogRef.close('success');
        }
    ); 
}

  ngOnInit() {
    this.addFestForm = this.formBuilder.group({
      name: ['', Validators.required],
    }, {
    });
    
    if (localStorage.getItem('currentUser')) {
        this.userDetails = JSON.parse(localStorage.getItem('currentUser'));
    }
    
  }
}