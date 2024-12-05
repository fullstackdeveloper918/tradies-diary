import { Component, Input, OnInit, Inject } from '@angular/core';
import { ViewCell } from 'ng2-smart-table';
import swal from 'sweetalert2';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { DatasourceService} from '../services/datasource.service';
import { NgxLoadingSpinnerService } from '@k-adam/ngx-loading-spinner';
import {DateAdapter, MAT_DATE_FORMATS} from '@angular/material/core';
import { AppDateAdapter, APP_DATE_FORMATS } from '../services/format-datepicker';
import {FormBuilder, FormGroup, Validators, FormArray, FormControl} from "@angular/forms";
import { ConfirmedValidator  } from '../services/confirm-password.validator';
import { AngularFireStorage, AngularFireStorageReference, AngularFireUploadTask } from '@angular/fire/compat/storage';

declare const $: any;

@Component({
  template: `
    <a href="#/daily-report/project/{{renderValue.projectId}}?date={{this.formatDate2(renderValue.todaysDate.toDate())}}"><i class="material-icons">edit</i></a>
    <a target="_blank" href="{{renderValue.pdfLink}}"><i class="material-icons">download</i></a>
    <a [routerLink]="[]" (click)="openDeleteDialog()"><i class="material-icons">delete</i></a>
  `
})
export class DailyRenderSupervisorComponent implements ViewCell, OnInit {

  public renderValue;
  public projectName;

 @Input() value: any;
 @Input() rowData: any;

  constructor(
    public dialog: MatDialog,
    private data_api: DatasourceService,
    private spinnerService: NgxLoadingSpinnerService,
    private afStorage: AngularFireStorage,
    ) {  }

  ngOnInit() {
    this.renderValue = this.rowData;
    this.projectName = this.value;
    console.log(this.projectName);
  }

  showSwal() {
        // swal({
        //     title: 'Input something',
        //     html: '<div class="form-group">' +
        //         '<input id="input-field" type="text" class="form-control" /><input matInput formControlName="lastName" type="text">' +
        //         '</div>',
        //     showCancelButton: true,
        //     confirmButtonClass: 'btn btn-success',
        //     cancelButtonClass: 'btn btn-danger',
        //     buttonsStyling: false
        // }).then(function(result) {
        //     swal({
        //         type: 'success',
        //         html: 'You entered: <strong>' +
        //             $('#input-field').val() +
        //             '</strong>',
        //         confirmButtonClass: 'btn btn-success',
        //         buttonsStyling: false

        //     })
        // }).catch(swal.noop)
    }

    // openDialog(): void {
    //     console.log(this.renderValue);
    //     const dialogRef = this.dialog.open(VisitorsDialog, {
    //         width: '400px',
    //         data: this.renderValue
    //     });

    //     dialogRef.afterClosed().subscribe(result => {
          
    //       if(result == 'success'){   
    //           setTimeout(function(){
    //             window.location.reload();
    //           }, 1000);  
    //       }
    //     });
    // }

    
    openDeleteDialog(): void {

      const dialogRef = this.dialog.open(DailyDeleteDialog, {
          width: '400px',
          data: {data: this.renderValue, projectName: this.projectName}
      });
  
      dialogRef.afterClosed().subscribe(result => {
        console.log(result);
    
          if(result){

                if(result.fest_confirm=='DELETE'){ 

                    this.spinnerService.show();   

                    for (let imageTBD of result.data.imageUpload) { 
                      this.afStorage.storage.refFromURL(imageTBD.imageFile).delete();
                    }

                    console.log(result.data.id);
                    
   
                    this.data_api.deleteFBDailyReport(result.data.id).then(() => {
                      this.spinnerService.hide();  
                      // this.addLog();
                      $.notify({
                        icon: 'notifications',
                        message: 'Daily Report Deleted'
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
        
                }else{
                  this.renderValue["fest_confirm"] = "";
                    swal.fire({
                        title: "Confirmation Failed!",
                        // text: "You clicked the button!",
                        buttonsStyling: false,
                        customClass: {
                          confirmButton: 'btn btn-success',
                        },
                        icon: "warning"
                    })
                    this.spinnerService.hide();
                }

          }
      });
   }

   public formatDate2(date) {
      var d = new Date(date),
          month = '' + (d.getMonth() + 1),
          day = '' + d.getDate(),
          year = d.getFullYear();

      if (month.length < 2) 
          month = '0' + month;
      if (day.length < 2) 
          day = '0' + day;

      // return [year, month, day].join('-');
      return [year, month, day ].join('-');
  }

}

// @Component({
//     selector: 'visitors-dialog',
//     templateUrl: 'visitorsdialog.html',
//     providers: [
//       {provide: DateAdapter, useClass: AppDateAdapter},
//       {provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS}
//     ]
//   })
// export class VisitorsDialog implements OnInit {
  
//     public agentData;
//     editForm: FormGroup;
//     pickupChoices= [
//       {value: 'admin', viewValue: 'Admin'},
//       {value: 'operator', viewValue: 'Operator'},
//       {value: 'crew', viewValue: 'Crew'},
//     ]

//     public userDetails;
//     public prevdata;

//     constructor(
//       private data_api: DatasourceService,
//       private spinnerService: NgxLoadingSpinnerService,
//       private formBuilder: FormBuilder,
//       public dialogRef: MatDialogRef<VisitorsDialog>,
//       @Inject(MAT_DIALOG_DATA) public data
//       ) {}
  
//     onNoClick(): void {
//       this.dialogRef.close();
//     }
//     ngOnInit() {
//         console.log(this.data);
        
//         this.editForm = this.formBuilder.group({
//           name: ['', Validators.required],
//       });
//         this.getVisitor();

//         if (localStorage.getItem('currentUser')) {
//           this.userDetails = JSON.parse(localStorage.getItem('currentUser'));
//         }

//     }

//     public addLog(){
//       // let newDetails;
//       // newDetails += 'Company:';

//       let today = new Date();
//       let passData = {
//           todaysDate: today,
//           log: 'Updated a Visitor - Global List',
//           method: 'update',
//           subject: 'visitor',
//           subjectID: this.data.id,
//           prevdata: this.prevdata,
//           data: this.editForm.value,
//           url: window.location.href
//       }
      
//       this.data_api.addActivityLog(this.userDetails.user_id,passData)
//             .subscribe(
//               (result) => {
//                 console.log(result);
//                 this.dialogRef.close('success');
//               }
//           ); 
//     }

//     public updateVisitor() {

//       if (this.editForm.invalid) {
//         alert('invalid');
//         return;
//       }
  
//       console.log(this.editForm.value);

//       this.spinnerService.show();

//       this.data_api.updateVisitor(this.data.id, this.editForm.value)
//           .subscribe(
//             (result) => {
//                 console.log(result);
//               if(result){

//                   swal.fire({
//                       title: "Visitor Name Updated",
//                       // text: "You clicked the button!",
//                       buttonsStyling: false,
//                       customClass: {
//                         confirmButton: 'btn btn-success',
//                       },
//                       icon: "success"
//                   })

//                   this.addLog();

//                   this.spinnerService.hide();

                  

//               }else{
//                 swal.fire({
//                     title: "Error in Updating Visitor",
//                     // text: "You clicked the button!",
//                     buttonsStyling: false,
//                     customClass: {
//                       confirmButton: 'btn btn-success',
//                     },
//                     icon: "error"
//                 })

//               }
//           },
//           (error) => {
//               console.log(error)
//               swal.fire({
//                   title: error.error.message,
//                   // text: "You clicked the button!",
//                   buttonsStyling: false,
//                   customClass: {
//                     confirmButton: 'btn btn-success',
//                   },
//                   icon: "error"
//               })
              
//           }
          
//         );   

//     }
    
//     public getVisitor(){
//       this.spinnerService.show();
//       this.data_api.getVisitor(this.data.id).subscribe((data) => {
//               console.log(data);
//               this.agentData = data;
//               console.log(data);
//               this.editForm.patchValue({
//                 name: this.agentData[0].visitor_name,
//               });

//               this.prevdata = this.editForm.value;
              
//               this.spinnerService.hide();
//         }
//       );
//     }
// }

@Component({
  selector: 'daily-deletedialog',
  templateUrl: 'daily-deletedialog.html',
  providers: [
    {provide: DateAdapter, useClass: AppDateAdapter},
    {provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS}
  ]
})

export class DailyDeleteDialog implements OnInit {

  deleteFestForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<DailyDeleteDialog>,
    @Inject(MAT_DIALOG_DATA) public data) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
    console.log(this.data);
    // this.deleteFestForm = this.formBuilder.group({
    //     // id: [''],
    //     fest_confirm: ['', Validators.required],
    // });
    
  }
}