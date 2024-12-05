import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Input, Inject} from '@angular/core';
import { DatasourceService} from '../services/datasource.service';
import { LocalDataSource } from 'ng2-smart-table';
import {FormBuilder, FormGroup, Validators, FormArray, FormControl} from "@angular/forms";
import { NgxLoadingSpinnerService } from '@k-adam/ngx-loading-spinner';
import * as ExcelJS from "exceljs/dist/exceljs.min.js"
import * as fs from 'file-saver'
import {LegacyPageEvent as PageEvent} from '@angular/material/legacy-paginator';
import {DateAdapter, MAT_DATE_FORMATS} from '@angular/material/core';
import { AppDateAdapter, APP_DATE_FORMATS } from '../services/format-datepicker';
import {MatLegacyDialog as MatDialog, MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA} from '@angular/material/legacy-dialog';
import swal from 'sweetalert2';
import {ProjectRenderComponent} from './projectbutton-render.component';
import {MatLegacyChipInputEvent as MatChipInputEvent} from '@angular/material/legacy-chips';
import {ENTER, COMMA} from '@angular/cdk/keycodes';
import { RoleChecker } from '../services/role-checker.service';

declare const $: any;

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
})
export class ProjectsComponent implements OnInit {

    source: LocalDataSource = new LocalDataSource;
    public projectList;
    visible: boolean = true;
    selectable: boolean = true;
    removable: boolean = true;
    addOnBlur: boolean = true;
    separatorKeysCodes = [ENTER, COMMA];
    public isChecked;
    public isSupervisor = false;

    adminData;

    colorBtnDefault;

    public settings = {
      actions: { 
        delete: false,
        add: false,
        edit: false,
        //custom: [{ name: 'ourCustomAction', title: `<i [routerLink]="['/edit', row.id]" class="material-icons">edit</i>` }],
      },
      pager: {
        display: false,
      },
      attr: {
        class: 'table table-bordered'
      },
      hideSubHeader: true,
      mode: 'external',
      columns: {
        // customactions: {
        //   title: 'Action',
        //   type : 'custom',
        //   valuePrepareFunction: (cell, row) => row,
        //     renderComponent: ProjectRenderComponent
        //   //   return `<a href="#/search/edit/${row.id}"><i class="material-icons">edit</i></a>`;
        // },
        customactions: {
          title: 'Action',
          type : 'html',
          width: '110px',
          filter: false,
          sort: false,
          valuePrepareFunction: (cell,row) => {
            return `<a href="#/projects/edit/${row.id}"><i class="material-icons">edit</i></a>
                    <a href="#/projects/view/${row.id}"><i class="material-icons">visibility</i></a>`;
          }
        },
        // id: {
        //   title: 'ID',
        //   valuePrepareFunction: (cell,row) => {
        //     return row.id;
        //   }
        // },
        project_name: {
          title: 'Project Name',
          filter: false,
          sort: false,
          valuePrepareFunction: (cell,row) => {
              return row.projectName;
          }
        },
        project_address: {
          title: 'Project Address',
          filter: false,
          sort: false,
          valuePrepareFunction: (cell,row) => {
              return row.projectAddress;
          }
        },
        image: {
          title: 'Image',
          type : 'html',
          filter: false,
          sort: false,
          valuePrepareFunction: (cell,row) => {
              return row.imageFile ? `<img class="table-image" style="max-width: 50px;margin: 5px 0;" src="${row.imageFile}">` : '';
          }
        },
        job_number: {
          title: 'Job Number',
          filter: false,
          sort: false,
          valuePrepareFunction: (cell,row) => {
              return row.jobNumber;
          }
        },
        client_name: {
          title: 'Client Name/s',
          filter: false,
          sort: false,
          valuePrepareFunction: (cell,row) => {
              return row.clientName;
          }
        },
        client_email: {
          title: 'Client Email',
          filter: false,
          sort: false,
          valuePrepareFunction: (cell,row) => {
              return row.clientEmail;
          }
        },
        aimed_date: {
          title: 'Aimed Completion Date',
          filter: false,
          sort: false,
          valuePrepareFunction: (cell,row) => {
              //return this.getFinalAimedDate(row.aimedDate,row.totalHours);
              return row.aimedComDate ? row.aimedComDate.toDate().toDateString() : '';
          }
        },
        // total_days: {
        //   title: 'Total Days Lost',
        //   valuePrepareFunction: (cell,row) => {
        //     return Math.floor( (row.totalHours/8) );
        //   }
        // },
        // total_hours: {
        //   title: 'Total Hours Lost',
        //   valuePrepareFunction: (cell,row) => {
        //       return ( (row.totalHours/8) - Math.floor( (row.totalHours/8) ) ) * 8;
        //   }
        // },
        // site_supervisor: {
        //   title: 'Site Supervisor',
        //   valuePrepareFunction: (cell,row) => {
        //       return row.display_name;
        //   }
        // },
        status: {
          title: 'Status',
          valuePrepareFunction: (cell,row) => {
              return row.projectStatus;
          }
        },       
      }
    };

    constructor(
      private data_api: DatasourceService,
      private formBuilder: FormBuilder,
      private spinnerService: NgxLoadingSpinnerService,
      public dialog: MatDialog,
      private rolechecker: RoleChecker
      ) { }

    public ngOnInit() {
        // this.rolechecker.check(4);

        this.getAdminSettings();
        let currentUser = JSON.parse((localStorage.getItem('currentUser')));
        console.log(currentUser);

        // if(currentUser.user_role=='project_supervisor'){
        //   this.getSupervisorProjects(currentUser.user_id);
        //   this.isSupervisor = true;
        //}else{
          this.getFBProjects();
          //this.isSupervisor = false;
        //}

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

    public getFinalAimedDate(aimedDate,totalHours){
       let plusDay = totalHours / 8;
       let rawAimedDate = new Date(aimedDate+'T00:00');
  
       if(plusDay > 0){
          return this.formatDate(rawAimedDate.setDate(rawAimedDate.getDate() + plusDay));
       }else{
         return this.formatDate(aimedDate);
       }
    }

    public formatDate(date) {
        var d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();
    
        if (month.length < 2) 
            month = '0' + month;
        if (day.length < 2) 
            day = '0' + day;
    
        // return [year, month, day].join('-');
        return [day, month, year].join('/');
    }

    getFBProjects(): void {
      this.spinnerService.show();
      this.data_api.getFBProjects().subscribe(data => {
        console.log(data);

          if(data){
            this.source = new LocalDataSource(data)
            this.spinnerService.hide();
          }

      });
    }

    public getActiveProjects(){
          this.spinnerService.show();

          this.data_api.getActiveProjects().subscribe((data) => {
              this.source.load(data);
              // this.projectList = data[0];
              this.spinnerService.hide();
              console.log(data);
          });
    }

    public getSupervisorProjects(curUserID){
        this.spinnerService.show();
    
        this.data_api.getProjectsSupervisor(curUserID).subscribe((data) => {
          this.source.load(data);
          // this.projectList = data[0];
          this.spinnerService.hide();
          console.log(data);
        })
    }

    public getAllProjects(){
        this.spinnerService.show();

        this.data_api.getProjects().subscribe((data) => {
            this.source.load(data);
            this.spinnerService.hide();
            // this.projectList = data[0];
            // this.spinnerService.hide();
            console.log(data);
        });
    }

    public checkValue(event: any){
        console.log(event);
        if(event == 'all'){
          this.getAllProjects();
        }else if(event == 'active'){
          this.getActiveProjects();
        }
    }

    openAddDialog(): void {
      const dialogRef = this.dialog.open(ProjectAddDialog, {
          width: '400px',
          // data: this.renderValue
      });

      dialogRef.afterClosed().subscribe(result => {
          console.log(result);
          if(result == 'success'){   
              setTimeout(function(){
                window.location.reload();
              }, 1000);  
          }
      });
  }
}


@Component({
  selector: 'projects-adddialog',
  templateUrl: 'projects-adddialog.html',
})

export class ProjectAddDialog implements OnInit {

  addFestForm: FormGroup;
  visible: boolean = true;
  selectable: boolean = true;
  removable: boolean = true;
  addOnBlur: boolean = true;
  separatorKeysCodes = [ENTER, COMMA];

  statusOption = [
    {value: 'active', viewValue: 'Active'},
    {value: 'inactive', viewValue: 'Inactive'},
  ]

  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<ProjectAddDialog>,
    private data_api: DatasourceService,
    private spinnerService: NgxLoadingSpinnerService,
    @Inject(MAT_DIALOG_DATA) public data) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  get g(){
    return this.addFestForm.controls;
  }
  
  public addNewProject() {

   
      if (this.addFestForm.invalid) {
        alert('invalid');
        return;
      }

      console.log(this.addFestForm.value);
  
      this.spinnerService.show();

      // let agentData = {
      //     "name": this.addFestForm.value.firstName,
      // };

      this.data_api.addProject(this.addFestForm.value)
      .subscribe(
        (result) => {
          if(result){

              swal.fire({
                  title: "New Project Created!",
                  // text: "You clicked the button!",
                  buttonsStyling: false,
                  customClass: {
                    confirmButton: 'btn btn-success',
                  },
                  icon: "success"
              })

              this.spinnerService.hide();

              this.dialogRef.close('success');

          }else{
            swal.fire({
                title: "Error in Creating New Project",
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
          this.spinnerService.hide();
      }
      
    );  
  }

  ngOnInit() {
    this.addFestForm = this.formBuilder.group({
      projectName: ['', Validators.required],
      clientName: ['', Validators.required],
      jobNumber: [''], 
      projectAddress: [''],
      projectStatus: ['', Validators.required],
      clientEmail: this.formBuilder.array([]),
      clientEmailCC: this.formBuilder.array([]),
      clientEmailBCC: this.formBuilder.array([]),
    }, {
    });
    
  }

  addClientEmail(event: MatChipInputEvent): void {
      let input = event.input;
      let value = event.value;

      // Add our dcbAccThisWeek
      if ((value || '').trim()) {
          const clientEmail = this.addFestForm.get('clientEmail') as FormArray;
          clientEmail.push(this.formBuilder.control(value.trim()));
      }

      // Reset the input value
      if (input) {
          input.value = '';
      }
  }

  removeClientEmail(index: number): void {
      const clientEmail = this.addFestForm.get('clientEmail') as FormArray;

      if (index >= 0) {
        clientEmail.removeAt(index);
      }
  }

  addClientEmailCC(event: MatChipInputEvent): void {
      let input = event.input;
      let value = event.value;

      // Add our dcbAccThisWeek
      if ((value || '').trim()) {
          const clientEmailCC = this.addFestForm.get('clientEmailCC') as FormArray;
          clientEmailCC.push(this.formBuilder.control(value.trim()));
      }

      // Reset the input value
      if (input) {
          input.value = '';
      }
  }

  removeClientEmailCC(index: number): void {
      const clientEmailCC = this.addFestForm.get('clientEmailCC') as FormArray;

      if (index >= 0) {
        clientEmailCC.removeAt(index);
      }
  }

  addClientEmailBCC(event: MatChipInputEvent): void {
    let input = event.input;
    let value = event.value;

    // Add our dcbAccThisWeek
    if ((value || '').trim()) {
        const clientEmailBCC = this.addFestForm.get('clientEmailBCC') as FormArray;
        clientEmailBCC.push(this.formBuilder.control(value.trim()));
    }

    // Reset the input value
    if (input) {
        input.value = '';
    }
  }

  removeClientEmailBCC(index: number): void {
    const clientEmailBCC = this.addFestForm.get('clientEmailBCC') as FormArray;

    if (index >= 0) {
      clientEmailBCC.removeAt(index);
    }
  }


}