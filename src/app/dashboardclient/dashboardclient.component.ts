import { Component, OnInit, AfterViewInit, Renderer2, ViewChild, ElementRef, Input, Inject} from '@angular/core';
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
import { RoleChecker } from '../services/role-checker.service';
import { first } from 'rxjs/operators';

declare const $: any;

@Component({
  selector: 'app-dashboardclient',
  templateUrl: './dashboardclient.component.html'
})
export class DashboardClientComponent {

  source: LocalDataSource = new LocalDataSource;
  public reportList;
  selectedMode: boolean = true;
  // This will contain selected rows
  selectedRows = [];
  filterWeeklyReports: FormGroup;
  public projectNames = [];
  public projectNamesRecVar = [];

  public siteSupervisors = [];
  public curUserID;

  public selected: any

  searchChoices = [
    {value: 'entry_date', viewValue: 'Entry Date'},
    {value: 'project_id', viewValue: 'Project'},
    // {value: 'supervisor_id', viewValue: 'Supervisor'},
    {value: 'has_image', viewValue: 'Uploaded Images'},
  ]

  imageBoolean = [
    {value: 'true', viewValue: 'Yes'},
    {value: 'false', viewValue: 'No'},
  ]

  public dashboardDailyReportSettings = {
    actions: { 
      delete: false,
      add: false,
      edit: false,
      //custom: [{ name: 'ourCustomAction', title: '<i [routerLink]="["/edit", card.id]" class="material-icons">edit</i>' }],
    },
    pager: {
      display: false,
    },
    attr: {
      class: 'table'
    },
    hideSubHeader: true,
    mode: 'external',
    selectedRowIndex: -1,
    columns: {
      customactions: {
        width: '30px',
        title: '',
        type : 'html',
        filter: false,
        sort: false,
        valuePrepareFunction: (cell,row) => {
          return `<a target="_blank" href="#/dashboard-variants/${row.id}"><i class="material-icons">preview</i></a>
                  `;
        }
      },
      variations_num: {
        title: 'Variations No.',
        width: '100px',
        filter: false,
        sort: false,
        valuePrepareFunction: (cell,row) => {
          return row.variantsNumber;
        }
      },
      variations_name: {
        title: 'Variations Name',
        filter: false,
        sort: false,
        valuePrepareFunction: (cell,row) => {
          return row.variationsName;
        }
      },
      project_name: {
        title: 'Project Name',
        filter: false,
        sort: false,
        valuePrepareFunction: (cell,row) => {
          return this.projectNames.find(o => o.id === row.projectId)?.projectName;
        }
      },
      due_date: {
        title: 'Due Date',
        width: '150px',
        filter: false,
        sort: false,
        valuePrepareFunction: (cell,row) => {
            return row.dueDate ? row.dueDate.toDate().toDateString(): '';
        }
      },
      status: {
        title: 'Status',
        width: '150px',
        sort: false,
        valuePrepareFunction: (cell,row) => {
            return row.status;
        }
      },
      created_at: {
        title: 'Created At',
        width: '500px',
        filter: false,
        sort: false,
        valuePrepareFunction: (cell,row) => {
            return row.createdAt ? row.createdAt.toDate().toString(): '';
        }
      }   
    }
  };


  public settings = {
    // selectMode: 'multi',
    actions: { 
      delete: false,
      add: false,
      edit: false,
      //custom: [{ name: 'ourCustomAction', title: '<i [routerLink]="["/edit", card.id]" class="material-icons">edit</i>' }],
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
      customactions: {
        width: '30px',
        title: 'Action',
        type : 'html',
        filter: false,
        valuePrepareFunction: (cell,row) => {
          return `<a href="#/weekly-report/edit/${row.id}"><i class="material-icons">edit</i></a>`;
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
        valuePrepareFunction: (cell,row) => {
            return row.project_name;
        }
      },
      entry_date: {
        title: 'Entry Date',
        valuePrepareFunction: (cell,row) => {
          return this.formatDate(row.entry_date);
        }
      },
      supervisor_name: {
        title: 'Supervisor Name',
        valuePrepareFunction: (cell,row) => {
            return row.display_name;
        }
      },
      lost_days_week : {
        title: 'Total Days Lost',
        valuePrepareFunction: (cell,row) => {
          return Math.floor( (row.lost_hours_week /8) );
        }
      },
      lost_hours_week : {
        title: 'Total Hours Lost',
        valuePrepareFunction: (cell,row) => {
            return ( (row.lost_hours_week / 8) - Math.floor( (row.lost_hours_week /8) ) ) * 8;
        }
      },
      image_size : {
        title: 'Total Size of Images',
        valuePrepareFunction: (cell,row) => {
            return this.formatBytes(row.total_file_size);
        }
      },
    }
  };

  public userDetails;

  public dashboardDailyReportList = [];

  constructor(
    private data_api: DatasourceService,
    private formBuilder: FormBuilder,
    private spinnerService: NgxLoadingSpinnerService,
    public dialog: MatDialog,
    private renderer2: Renderer2,
    private e: ElementRef,
    private rolechecker: RoleChecker
    ) { }

  public ngOnInit() {
      // this.rolechecker.check(3)
      // this.getWeeklyReports();
      this.filterWeeklyReports = this.formBuilder.group({
          entryDate: [''],
          projectID: [''],
          supervisorId: [''],
          hasImage: [''],
      });

      if (localStorage.getItem('currentUser')) {
          this.userDetails = JSON.parse(localStorage.getItem('currentUser'));
      }
      console.log( this.userDetails);
      this.getFBProjects();
      // this.getSupervisors();
  }
  
  findIdFromEmail(): Promise<string | null> {
    return new Promise((resolve, reject) => {
      this.data_api.getFBUsersOrdered().subscribe((data: any) => {
        console.log('data', data);
        const user = data.find((user: any) => user.userEmail === this.userDetails.email);
        console.log('user', user ? user.id : 'No user found');
        
        if (user) {
          resolve(user.id); // Resolve the promise with the user.id
        } else {
          resolve(null); // If no user found, resolve with null or handle as needed
        }
      }, (error) => {
        reject(error); // Reject the promise if there's an error in the observable
      });
    });
  }

  async getFBRecent(){
       const toSearchId = await this.findIdFromEmail();
       console.log('toSearchId', toSearchId)
        this.data_api.getFBClientVariations(toSearchId).pipe().subscribe(dataDailyReports => {
            console.log(dataDailyReports);
            // this.source = new LocalDataSource(dataDailyReports)
            if(dataDailyReports){
                this.dashboardDailyReportList = [];
                dataDailyReports.forEach(data =>{  
                    if(data){
                      if(data.status != "Draft"){
                        this.dashboardDailyReportList.push(data)
                      }
                    }
                    
                })
            }
            this.source = new LocalDataSource(this.dashboardDailyReportList)
            this.getFBRecent2();
            // console.log(this.dashboardDailyReportList);

        });


  }
  
  getFBRecent2(){
    if(this.projectNamesRecVar){

      this.projectNamesRecVar.forEach(async projectId =>{ 
          console.log(projectId);

          await this.data_api.getFBClientVariationsProject(projectId).pipe().subscribe(dataDailyReports2 => {
              console.log(dataDailyReports2);
      
              if(dataDailyReports2){
                //  this.dashboardDailyReportList = [];
                dataDailyReports2.forEach(data =>{  
                      if(data){
                        if(data.status != "Draft"){
                          this.dashboardDailyReportList.push(data)
                        }
                      }
                      
                  })
              }

              const mapFromColors = new Map(
                this.dashboardDailyReportList.map(c => [c.id, c])
              );
              
              const uniqueColors = [...mapFromColors.values()];

              this.source = new LocalDataSource(uniqueColors)
          });
      })

    }
  
    // console.log(this.dashboardDailyReportList);
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

  public formatBytes(bytes, decimals = 2) {

     if (bytes > 0){
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
     }else{
        return '0 Bytes';
     }
}

getFBProjects() {
     
  this.data_api.getFBRecentProjects().subscribe(data => {
    console.log(data);
    let projectList = [];
    this.projectNames = [];
      if(data){
        data.forEach(data2 =>{ 
          projectList.push(data2);

          if(data2.recipientVariation){
            if(data2.recipientVariation.includes( this.userDetails.user_id)){
                this.projectNamesRecVar.push(data2.id);
            }
          }

        })

        this.projectNames = projectList;

        this.projectNames.sort(function(a, b) {
            var textA = a.projectName.toUpperCase();
            var textB = b.projectName.toUpperCase();
            return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
        });

        console.log(this.projectNames);
        console.log(this.projectNamesRecVar);

      }

      this.getFBRecent();

  });

}

  // public getProjects(){
  //     // this.spinnerService.show();
  //     let currentUser = JSON.parse((localStorage.getItem('currentUser')));
  //     this.curUserID = currentUser.user_id;

  //     this.data_api.getProjectsClient(this.curUserID).subscribe((data) => {
  //       console.log(data);
  //         data.forEach(data =>{ 
  //             this.projectNames.push(data)
  //         })
  //     });
  // }
  

  // public getSupervisors(){
  //       // this.spinnerService.show();

  //       this.data_api.getProjectSupervisors().subscribe((data) => {
  //           data.forEach(data =>{ 
  //               this.siteSupervisors.push(data)
  //           })
  //       });
  // }

  public getWeeklyReports(){
        this.spinnerService.show();

        let currentUser = JSON.parse((localStorage.getItem('currentUser')));
        this.curUserID = currentUser.user_id;

        this.data_api.getWeeklyReportsClient(this.curUserID).subscribe((data) => {
            this.source.load(data);
            this.reportList = data;
            this.spinnerService.hide();
            console.log(this.reportList);

            this.selectedMode = false;
            setTimeout(() => {
              this.disableCheckboxes();
            }, 1000);
            // this.disableCheckboxes();

        });
  }

  ngAfterViewInit() {
    /* You can call this with a timeOut because if you don't you'll only see one checkbox... the other checkboxes take some time to render and appear, which is why we wait for it */
    // setTimeout(() => {
    //   this.disableCheckboxes();
    // }, 5000);
    // this.getWeeklyReports();
  }

  public filterReports(){
    this.spinnerService.show();
      console.log(this.filterWeeklyReports.value);

      this.data_api.getClientWeeklyReportsQuery(this.curUserID, this.filterWeeklyReports.value).subscribe((data) => {
        console.log(data);
        this.source.load(data);
        this.reportList = data;
        this.spinnerService.hide();
        // this.hidePaginator = true;

        this.selectedMode = false;
        setTimeout(() => {
          this.disableCheckboxes();
        }, 1000);
        
      })
  }

  public disableCheckboxes() {
    var checkbox = this.e.nativeElement.querySelectorAll('input[type=checkbox]');
    checkbox.forEach((element, index) => {

      // /* disable the select all checkbox */
      // if (index == 0){this.renderer2.setAttribute(element, "disabled", "true");}

      /* disable the checkbox if set column is false */
      if (index >0 && this.reportList[index-1].has_image != 'true') {
        this.renderer2.setAttribute(element, "disabled", "true");
      }

    });
  }

    // UserRowSelected Event handler
    onRowSelect(event) {
      console.log(event);
      this.selectedRows = [];
      event.selected.forEach(element => {
          if(element.has_image == 'true'){
            this.selectedRows.push(element)
          }
      });
      console.log(this.selectedRows);
    }
  
    public deleteImages(){
      this.spinnerService.show();
      console.log(this.selectedRows);

      this.data_api.deleteWeeklyReportsImages(this.selectedRows).subscribe((data) => {
          console.log(data);

          swal.fire({
            title: "Images Deleted.",
            // text: "You clicked the button!",
            buttonsStyling: false,
            customClass: {
              confirmButton: 'btn btn-success',
            },
            icon: "success"
        })

          this.spinnerService.hide();
          window.location.reload();
      });
      
    }


}