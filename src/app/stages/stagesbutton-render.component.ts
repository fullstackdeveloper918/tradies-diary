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

declare const $: any;

@Component({
  template: `
    <a [routerLink]="[]" (click)="openDialog()"><i class="material-icons">edit</i></a>
    <a [routerLink]="[]" (click)="openDeleteDialog()"><i class="material-icons">delete</i></a>
  `
})
export class StagesRenderComponent implements ViewCell, OnInit {

  public renderValue;

  @Input() value: string | number;
  @Input() rowData: any;

  public userDetails;
  public prevdata;

  constructor(
    public dialog: MatDialog,
    private data_api: DatasourceService,
    private spinnerService: NgxLoadingSpinnerService,
    ) {  }

  ngOnInit() {
    this.renderValue = this.value;
    console.log(this.renderValue);

    this.prevdata = this.renderValue;

    if (localStorage.getItem('currentUser')) {
      this.userDetails = JSON.parse(localStorage.getItem('currentUser'));
    }

  }

    openDialog(): void {
        console.log(this.renderValue);
        const dialogRef = this.dialog.open(StagesDialog, {
            width: '400px',
            data: this.renderValue
        });

        dialogRef.afterClosed().subscribe(result => {
          
          if(result == 'success'){   
              // setTimeout(function(){
              //   window.location.reload();
              // }, 1000);  
          }
        });
    }

    
    openDeleteDialog(): void {

      const dialogRef = this.dialog.open(StagesDeleteDialog, {
          width: '400px',
          data: this.renderValue
      });
  
      dialogRef.afterClosed().subscribe(result => {
        console.log(result);
        
          if(result){ 

            console.log(result);
            this.spinnerService.show();   
                console.log(result);
                this.data_api.deleteFBStage(result).then(() => {
                  console.log('Delete new Supplier Global List successfully!');
                  this.addLog();
                  $.notify({
                    icon: 'notifications',
                    message: 'Supplier Deleted'
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

      }); 
    }

    addLog(){
        this.spinnerService.show();
        let today = new Date();
        let passData = {
            todaysDate: today,
            log: 'Deleted Stage - Global List',
            method: 'delete',
            subject: 'stage',
            subjectID: this.renderValue.stageID,
            prevdata: this.prevdata,
            data: '',
            url: window.location.href,
            userID: this.userDetails.user_id,
            userName: this.userDetails.name
        }
        this.data_api.addFBActivityLog(passData).then(() => {
          this.spinnerService.hide();
        });
    }

}

@Component({
    selector: 'stages-dialog',
    templateUrl: 'stagesdialog.html',
    providers: [
      {provide: DateAdapter, useClass: AppDateAdapter},
      {provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS}
    ]
  })
export class StagesDialog implements OnInit {
  
    public agentData;
    editForm: FormGroup;

    public userDetails;
    public prevdata;

    adminData;

    colorBtnDefault;

    constructor(
      private data_api: DatasourceService,
      private spinnerService: NgxLoadingSpinnerService,
      private formBuilder: FormBuilder,
      public dialogRef: MatDialogRef<StagesDialog>,
      @Inject(MAT_DIALOG_DATA) public data
      ) {}
  
    onNoClick(): void {
      this.dialogRef.close();
    }
    ngOnInit() {
        console.log(this.data);
        this.getAdminSettings();

        this.editForm = this.formBuilder.group({
            stageID: ['', Validators.required],
            stageName: ['', Validators.required],
        });

        this.editForm.patchValue({
          stageID: this.data.stageID,
          stageName: this.data.stageName,
        });

        this.prevdata = this.editForm.value;

        if (localStorage.getItem('currentUser')) {
          this.userDetails = JSON.parse(localStorage.getItem('currentUser'));
        }

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

  //   public addLog(){
  //     let today = new Date();
  //     let passData = {
  //         todaysDate: today,
  //         log: 'Updated a Stage - Global List',
  //         method: 'update',
  //         subject: 'stage',
  //         subjectID: this.data.id,
  //         prevdata: this.prevdata,
  //         data: this.editForm.value,
  //         url: window.location.href
  //     }
      
  //     this.data_api.addActivityLog(this.userDetails.user_id,passData)
  //       .subscribe(
  //         (result) => {
  //           console.log(result);
  //           this.dialogRef.close('success');
  //         }
  //     ); 
  // }

  public addLog(){
      let today = new Date();
      let passData = {
          todaysDate: today,
          log: 'Updated a Stage - Global List',
          method: 'update',
          subject: 'stage',
          subjectID: this.data.stageID,
          prevdata: this.prevdata,
          data: this.editForm.value,
          url: window.location.href,
          userID: this.userDetails.user_id,
          userName: this.userDetails.name
      }
      this.data_api.addFBActivityLog(passData).then(() => {
        this.dialogRef.close('success');
        this.spinnerService.hide();
      });
  }

  public updateFBStage(): void {

    if (this.editForm.invalid) {

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

    console.log();
    
    this.data_api.updateFBStage(this.data, this.editForm.value).then(() => {
      this.addLog();
        $.notify({
          icon: 'notifications',
          message: 'Supplier Updated'
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

}

@Component({
  selector: 'stages-deletedialog',
  templateUrl: 'stages-deletedialog.html',
  providers: [
    {provide: DateAdapter, useClass: AppDateAdapter},
    {provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS}
  ]
})

export class StagesDeleteDialog implements OnInit {

  deleteForm: FormGroup;
  deleteConfirm;

  adminData;

  colorBtnDefault;

  constructor(
    private formBuilder: FormBuilder,
    private data_api: DatasourceService,
    public dialogRef: MatDialogRef<StagesDeleteDialog>,
    @Inject(MAT_DIALOG_DATA) public data) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  confirmDelete(): void {

    if(this.deleteConfirm == 'DELETE'){
      this.dialogRef.close(this.deleteForm.value);
    }else{
      this.dialogRef.close();
      $.notify({
        icon: 'notifications',
        message: 'Confirmation Failed'
      }, {
          type: 'danger',
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
    }
    
  }

  ngOnInit() {
    this.getAdminSettings();
    this.deleteForm = this.formBuilder.group({
        stageID: ['', Validators.required],
        stageName: ['', Validators.required],
    });
    
    this.deleteForm.patchValue({
      stageID: this.data.stageID,
      stageName: this.data.stageName,
    });
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
}