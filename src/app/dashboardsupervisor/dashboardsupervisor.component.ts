import { Component, OnInit, AfterViewInit, Renderer2, ViewChild, ElementRef, Input, Inject, HostListener} from '@angular/core';
import { DatasourceService} from '../services/datasource.service';
import { LocalDataSource } from 'ng2-smart-table';
import {FormBuilder, FormGroup, Validators, FormArray, FormControl} from "@angular/forms";
// import { Ng4LoadingSpinnerService } from 'ng4-loading-spinner';
import * as ExcelJS from "exceljs/dist/exceljs.min.js"
import * as fs from 'file-saver'
import {LegacyPageEvent as PageEvent} from '@angular/material/legacy-paginator';
import {DateAdapter, MAT_DATE_FORMATS} from '@angular/material/core';
import { AppDateAdapter, APP_DATE_FORMATS } from '../services/format-datepicker';
import {MatLegacyDialog as MatDialog, MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA} from '@angular/material/legacy-dialog';
import swal from 'sweetalert2';
import { RoleChecker } from '../services/role-checker.service';
import { NgxLoadingSpinnerService } from '@k-adam/ngx-loading-spinner';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {MyService} from '../services/image-upload-service'; 
// import { DailyDeleteRenderComponent } from './dailybutton-render.component';
// import { WeeklyDeleteRenderComponent } from './weeklybutton-render.component';
import { AuthenticationService } from '../shared/authentication.service';
import * as moment from 'moment';
import { AngularFireStorage, AngularFireStorageReference, AngularFireUploadTask } from '@angular/fire/compat/storage';
import {  first, reduce, map, finalize, take  } from 'rxjs/operators';
import { NgxProgressOverlayService } from 'ngx-progress-overlay';
import { getStorage, ref, list, listAll } from "firebase/storage";
import { NgxGalleryOptions, NgxGalleryImage, NgxGalleryAnimation } from 'ngx-gallery-9';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { Observable, Observer } from 'rxjs';

declare const $: any;

@Component({
  selector: 'app-dashboardsupervisor',
  templateUrl: './dashboardsupervisor.component.html'
})
export class DashboardSupervisorComponent {
  
  public selected: any

  public dashboardWorkerList: LocalDataSource = new LocalDataSource;

  public dashboardDailyReportList = [];
  public dashboardWeeklyReportList = [];
  public dashboardProjectsList = [];
  public dashboardTradesList = [];
  public dashboardUsersList = [];

  public projectNames = [];

  public dashboardSearchDateDailyReportList = [];
  public dashboardSearchDateWeeklyReportList = [];
  public dashboardSearchDateWorkerList = [];
  public dashboardSearchProjectList = [];
  public dashboardSearchProjectDailyList = [];
  public dashboardSearchProjectWeeklyList = [];
  public dashboardSearchProjectWorkerList = [];
  public dashboardSearchWorkerList = [];
  public dashboardSearchSupervisorDailyList = [];
  public dashboardSearchTradesDailyList = [];

  public dashboardSearchWorkerId;
  public dashboardSearchSupervisorDailyId;
  public dashboardSearchTradesDailyId;

  searchWorkerTableData: any[] = [];
  searchWorkerFirstInResponse: any = [];
  searchWorkerLastInResponse: any = [];
  searchWorkerPrev_strt_at: any = [];
  searchWorkerPagination_clicked_count = 0;
  searchWorkerDisable_next: boolean = false;
  searchWorkerDisable_prev: boolean = false;

  searchTradesTableData: any[] = [];
  searchTradesFirstInResponse: any = [];
  searchTradesLastInResponse: any = [];
  searchTradesPrev_strt_at: any = [];
  searchTradesPagination_clicked_count = 0;
  searchTradesDisable_next: boolean = false;
  searchTradesDisable_prev: boolean = false;

  searchSupervisorTableData: any[] = [];
  searchSupervisorFirstInResponse: any = [];
  searchSupervisorLastInResponse: any = [];
  searchSupervisorPrev_strt_at: any = [];
  searchSupervisorPagination_clicked_count = 0;
  searchSupervisorDisable_next: boolean = false;
  searchSupervisorDisable_prev: boolean = false;

  accountFirebase;

  supervisorProjects=[];

  public dashboardWorkerSettings = {
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
      worker_name: {
        title: 'Name',
        width: '300px',
        filter: false,
        sort: false,
        valuePrepareFunction: (cell,row) => {
          return this.filterWorkers.find(o => o.id === row.workerID)?.userFirstName + ' ' +this.filterWorkers.find(o => o.id === row.workerID)?.userLastName;
        }
      },
      project_name: {
        title: 'Project',
        width: '300px',
        filter: false,
        sort: false,
        valuePrepareFunction: (cell,row) => {
          return this.projectNames.find(o => o.id === row.projectId)?.projectName;
        }
      },
      number_images: {
        title: 'No. Images',
        width: '120px',
        filter: false,
        sort: false,
        valuePrepareFunction: (cell,row) => {
          return row.imageUpload.length;
        }
      },
      entry_date: {
        title: 'Entry Date',
        width: '150px',
        filter: false,
        sort: false,
        valuePrepareFunction: (cell,row) => {
            return row.selectedDate ? row.selectedDate.toDate().toDateString(): '';
        }
      },
      entry_status: {
        title: 'Entry Status',
        width: '10%',
        filter: false,
        sort: false,
        valuePrepareFunction: (cell,row) => {
            return row.entryStatus;
        }
      },
      notes: {
        title: 'Accomplishments',
        filter: false,
        sort: false,
        valuePrepareFunction: (cell,row) => {
            return this.beautifyNotes(row.accomplishments);
        }
      },
      // start: {
      //   title: 'Start',
      //   width: '8%',
      //   valuePrepareFunction: (cell,row) => {
      //       return row.start;
      //   }
      // },
      // break: {
      //   title: 'Break',
      //   width: '8%',
      //   valuePrepareFunction: (cell,row) => {
      //       return row.break;
      //   }
      // },
      // finish: {
      //   title: 'Finish',
      //   width: '8%',
      //   valuePrepareFunction: (cell,row) => {
      //       return row.finish;
      //   }
      // },
      // entry_status: {
      //   title: 'Status',
      //   width: '10%',
      //   valuePrepareFunction: (cell,row) => {
      //       return row.entry_status + ' ' + (row.modified_by ? "(modified by "+row.modified_by+")" : "") + ' ' + (row.modified_date ? "(updated last "+moment(row.modified_date).format('MM/DD/YYYY')+")" : "");
      //   }
      // },
    }
  };

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
        width: '80px',
        title: '',
        type : 'html',
        filter: false,
        sort: false,
        valuePrepareFunction: (cell,row) => {
          return `<a target="_blank" href="#/daily-report/project/${row.projectId}?date=${this.formatDate(row.todaysDate)}"><i class="material-icons">edit</i></a>
                  <a target="_blank" href="${row.pdfLink}"><i class="material-icons">download</i></a>
                  `;
        }
      },
      report_number: {
        title: 'Report No.',
        width: '100px',
        filter: false,
        sort: false,
        valuePrepareFunction: (cell,row) => {
          return row.reportNumber;
        }
      },
      project_name: {
        title: 'Project Name',
        width: '350px',
        filter: false,
        sort: false,
        valuePrepareFunction: (cell,row) => {
          return this.projectNames.find(o => o.id === row.projectId)?.projectName;
        }
      },
      entry_date: {
        title: 'Entry Date',
        width: '150px',
        filter: false,
        sort: false,
        valuePrepareFunction: (cell,row) => {
            return row.todaysDate ? row.todaysDate.toDate().toDateString(): '';
        }
      },
      number_trades: {
        title: 'No. Trades',
        width: '120px',
        filter: false,
        sort: false,
        valuePrepareFunction: (cell,row) => {
          return row.tradeFormArray.length;
        }
      },
      number_visitors: {
        title: 'No. Visitors',
        width: '120px',
        filter: false,
        sort: false,
        valuePrepareFunction: (cell,row) => {
          return row.visitorFormArray.length;
        }
      },
      number_images: {
        title: 'No. Images',
        width: '120px',
        filter: false,
        sort: false,
        valuePrepareFunction: (cell,row) => {
          return row.imageUpload.length;
        }
      },
      created_at: {
        title: 'Created At',
        filter: false,
        sort: false,
        valuePrepareFunction: (cell,row) => {
            return row.createdAt ? row.createdAt.toDate().toString(): '';
        }
      },
    }
  };

  public dashboardWeeklyReportSettings = {
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
    selectedRowIndex: -1,
    mode: 'external',
    columns: {
      customactions: {
        width: '80px',
        title: '',
        type : 'html',
        filter: false,
        sort: false,
        valuePrepareFunction: (cell,row) => {
          return `<a target="_blank" href="#/weekly-report/edit/${row.id}"><i class="material-icons">edit</i></a>
          <a target="_blank" href="${row.pdfLink}"><i class="material-icons">download</i></a>
          `;
        }
      },
      report_number: {
        title: 'Report #',
        width: '100px',
        filter: false,
        sort: false,
        valuePrepareFunction: (cell,row) => {
          return row.reportNumber;
        }
      },
      project_name: {
        title: 'Project Name',
        width: '350px',
        filter: false,
        sort: false,
        valuePrepareFunction: (cell,row) => {
            return this.projectNames.find(o => o.id === row.projectId)?.projectName;
        }
      },
      entry_date: {
        title: 'Entry Date',
        width: '150px',
        filter: false,
        sort: false,
        valuePrepareFunction: (cell,row) => {
            return  row.weekendDate ? row.weekendDate.toDate().toDateString(): ''; 
            //this.formatDate(row.weekendDate);
        }
      },
      number_images: {
        title: 'No. Images',
        width: '120px',
        filter: false,
        sort: false,
        valuePrepareFunction: (cell,row) => {
          return row.imageUpload ? row.imageUpload.length: '0'; 
        }
      },
      // supervisor_name: {
      //   title: 'Supervisor Name',
      //   valuePrepareFunction: (cell,row) => {
      //       return row.supervisor_name;
      //   }
      // },
      // lost_days_week : {
      //   title: 'Total Days Lost',
      //   valuePrepareFunction: (cell,row) => {
      //     //return Math.floor( (row.lost_hours_week /8) );
      //     return row.lostTotalDays;
      //   }
      // },
      // lost_hours_week : {
      //   title: 'Total Hours Lost',
      //   valuePrepareFunction: (cell,row) => {
      //       //return ( (row.lost_hours_week / 8) - Math.floor( (row.lost_hours_week /8) ) ) * 8;
      //       return row.lostTotalHours;
      //   }
      // },
      created_at: {
        title: 'Created At',
        filter: false,
        sort: false,
        valuePrepareFunction: (cell,row) => {
            return row.createdAt ? row.createdAt.toDate().toString(): '';
        }
      },
    }
  };

  public dashboardProjectsSettings = {
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
    selectedRowIndex: -1,
    columns: {
      // customactions: {
      //   width: '80px',
      //   title: '',
      //   type : 'html',
      //   filter: false,
      //   sort: false,
      //   valuePrepareFunction: (cell,row) => {
      //     return `<a href="#/projects/edit/${row.id}"><i class="material-icons">edit</i></a>`;
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
      job_number: {
        title: 'Job Number',
        filter: false,
        sort: false,
        valuePrepareFunction: (cell,row) => {
            return row.jobNumber;
        }
      },    
    }
  };

  public dashboardTradesSettings = {
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
    columns: {
      customactions: {
        width: '80px',
        title: 'Action',
        type : 'html',
        filter: false,
        valuePrepareFunction: (cell,row) => {
          return `<a href="#/trades/edit/${row.id}"><i class="material-icons">edit</i></a>`;
        }
      }, 
      company_name: {
        title: 'Company Name',
        valuePrepareFunction: (cell,row) => {
            return row.company_name;
        }
      },
      email: {
        title: 'Email',
        valuePrepareFunction: (cell,row) => {
            return row.email;
        }
      },
      phone: {
        title: 'Phone',
        valuePrepareFunction: (cell,row) => {
            return row.phone;
        }
      },
    }
  };

  public dashboardUsersSettings = {
    actions: { 
      delete: false,
      add: false,
      edit: false,
      //custom: [{ name: 'ourCustomAction', title: '<i [routerLink]="["/edit", card.id]" class="material-icons">edit</i>' }],
    },
    attr: {
      class: 'table'
    },
    pager : {
      display : false,
    },
    hideSubHeader: true,
    mode: 'external',
    columns: {
      UserID: {
        title: 'ID',
        valuePrepareFunction: (cell,row) => {
          return row.id;
        }
      },
      DisplayName: {
        title: 'Full Name',
        valuePrepareFunction: (cell,row) => {
          return row.display_name;
        }
      },
      EmailAddress: {
        title: 'Email Address',
        valuePrepareFunction: (cell,row) => {
          return row.user_email;
        }
      },
    }
  };

  public dashboardSearchDateDailySettings = {
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
    columns: {
      customactions: {
        width: '120px',
        title: 'Action',
        type : 'html',
        filter: false,
        valuePrepareFunction: (cell,row) => {
          return `<a target="_blank" href="#/daily-report/project/${row.projectId}?date=${this.formatDate(row.todaysDate)}"><i class="material-icons">preview</i></a>
          `;
        }
      },
      project_name: {
        title: 'Project Name',
        valuePrepareFunction: (cell,row) => {
            return this.projectNames.find(o => o.id === row.projectId)?.projectName;
        }
      },
      entry_date: {
        title: 'Entry Date',
        valuePrepareFunction: (cell,row) => {
            return row.todaysDate ? row.todaysDate.toDate().toDateString(): '';
        }
      },
      num_of_trades: {
        title: 'Trades On Site',
        valuePrepareFunction: (cell,row) => {
          return this.countNumber(row.tradeFormArray);
        }
      },
      num_of_staff: {
        title: 'Staff On Site',
        valuePrepareFunction: (cell,row) => {
          return this.countNumber(row.staffFormArray);
        }
      },
      num_of_visitors: {
        title: 'Visitors On Site',
        valuePrepareFunction: (cell,row) => {
          return this.countNumber(row.visitorFormArray);
        }
      },
    }
  };

  public dashboardSearchDateWeeklySettings = {
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
    columns: {
      customactions: {
        width: '120px',
        title: 'Action',
        type : 'html',
        filter: false,
        valuePrepareFunction: (cell,row) => {
          return `<a target="_blank" href="#/weekly-report/edit/${row.id}"><i class="material-icons">preview</i></a>
          `;
        }
      },
      project_name: {
        title: 'Project Name',
        valuePrepareFunction: (cell,row) => {
          return this.projectNames.find(o => o.id === row.projectId)?.projectName;
        }
      },
      entry_date: {
        title: 'Entry Date',
        valuePrepareFunction: (cell,row) => {
          return row.weekendDate ? row.weekendDate.toDate().toDateString(): '';
        }
      },
      lost_days_week : {
        title: 'Total Days Lost',
        valuePrepareFunction: (cell,row) => {
          return row.lostWeekDays ? row.lostWeekDays : 0;
        }
      },
      lost_hours_week : {
        title: 'Total Hours Lost',
        valuePrepareFunction: (cell,row) => {
            return row.lostWeekHours ? row.lostWeekHours : 0;
        }
      },
    }
  };

  public dashboardSearchDateWorkerSettings = {
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
    columns: {
      worker_name: {
        title: 'Name',
        width: '15%',
        valuePrepareFunction: (cell,row) => {
            return this.filterWorkers.find(o => o.id === row.workerID)?.userFirstName + ' ' +this.filterWorkers.find(o => o.id === row.workerID)?.userLastName;
        }
      },
      project_name: {
        title: 'Project',
        width: '15%',
        valuePrepareFunction: (cell,row) => {
           return this.projectNames.find(o => o.id === row.projectId)?.projectName;
        }
      },
      entry_date: {
        title: 'Entry Date',
        width: '15%',
        valuePrepareFunction: (cell,row) => {
          return row.selectedDate ? row.selectedDate.toDate().toDateString(): '';
        }
      },
      notes: {
        title: 'Notes',
        width: '25%',
        valuePrepareFunction: (cell,row) => {
            return this.beautifyNotes(row.accomplishments);
        }
      },
      start: {
        title: 'Start',
        width: '8%',
        valuePrepareFunction: (cell,row) => {
            return row.start;
        }
      },
      break: {
        title: 'Break',
        width: '8%',
        valuePrepareFunction: (cell,row) => {
            return row.break;
        }
      },
      finish: {
        title: 'Finish',
        width: '8%',
        valuePrepareFunction: (cell,row) => {
            return row.finish;
        }
      },
    }
  };

  public dashboardSearchProjectsSettings = {
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
    columns: {
      customactions: {
        width: '120px',
        title: 'Action',
        type : 'html',
        filter: false,
        valuePrepareFunction: (cell,row) => {
          return `<a target="_blank" href="#/projects/edit/${row.id}"><i class="material-icons">edit</i></a>`;
        }
      },
      project_name: {
        title: 'Project Name',
        valuePrepareFunction: (cell,row) => {
            return row.projectName;
        }
      },
      project_address: {
        title: 'Project Address',
        valuePrepareFunction: (cell,row) => {
            return row.projectAddress;
        }
      },
      job_number: {
        title: 'Job Number',
        valuePrepareFunction: (cell,row) => {
            return row.jobNumber;
        }
      },    
    }
  };

  public dashboardSearchProjectDailySettings = {
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
    columns: {
      customactions: {
        width: '120px',
        title: 'Action',
        type : 'html',
        filter: false,
        valuePrepareFunction: (cell,row) => {
          return `<a target="_blank" href="#/daily-report/project/${row.projectId}?date=${this.formatDate(row.todaysDate)}"><i class="material-icons">preview</i></a>
          `;
        }
      },
      project_name: {
        title: 'Project Name',
        valuePrepareFunction: (cell,row) => {
           return this.projectNames.find(o => o.id === row.projectId)?.projectName;
        }
      },
      entry_date: {
        title: 'Entry Date',
        valuePrepareFunction: (cell,row) => {
           return row.todaysDate ? row.todaysDate.toDate().toDateString(): '';
        }
      },
      num_of_trades: {
        title: 'Trades On Site',
        valuePrepareFunction: (cell,row) => {
          return this.countNumber(row.tradeFormArray);
        }
      },
      num_of_staff: {
        title: 'Staff On Site',
        valuePrepareFunction: (cell,row) => {
          return this.countNumber(row.staffFormArray);
        }
      },
      num_of_visitors: {
        title: 'Visitors On Site',
        valuePrepareFunction: (cell,row) => {
          return this.countNumber(row.visitorFormArray);
        }
      },
    }
  };

  public dashboardSearchProjectWeeklySettings = {
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
    columns: {
      customactions: {
        width: '120px',
        title: 'Action',
        type : 'html',
        filter: false,
        valuePrepareFunction: (cell,row) => {
          return `<a target="_blank" href="#/weekly-report/edit/${row.id}"><i class="material-icons">preview</i></a>
          `;
        }
      },
      project_name: {
        title: 'Project Name',
        valuePrepareFunction: (cell,row) => {
          return this.projectNames.find(o => o.id === row.projectId)?.projectName;
        }
      },
      entry_date: {
        title: 'Entry Date',
        valuePrepareFunction: (cell,row) => {
          return row.weekendDate ? row.weekendDate.toDate().toDateString(): '';
        }
      },
      // supervisor_name: {
      //   title: 'Supervisor Name',
      //   valuePrepareFunction: (cell,row) => {
      //       return row.supervisor_name;
      //   }
      // },
      lost_days_week : {
        title: 'Total Days Lost',
        valuePrepareFunction: (cell,row) => {
          return row.lostWeekDays ? row.lostWeekDays : 0;
        }
      },
      lost_hours_week : {
        title: 'Total Hours Lost',
        valuePrepareFunction: (cell,row) => {
          return row.lostWeekHours ? row.lostWeekHours : 0;
        }
      },
    }
  };

  public dashboardSearchProjectWorkerSettings = {
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
    columns: {
      worker_name: {
        title: 'Name',
        width: '15%',
        valuePrepareFunction: (cell,row) => {
          return this.filterWorkers.find(o => o.id === row.workerID)?.userFirstName + ' ' +this.filterWorkers.find(o => o.id === row.workerID)?.userLastName;
        }
      },
      project_name: {
        title: 'Project',
        width: '15%',
        valuePrepareFunction: (cell,row) => {
          return this.projectNames.find(o => o.id === row.projectId)?.projectName;
        }
      },
      entry_date: {
        title: 'Entry Date',
        width: '15%',
        valuePrepareFunction: (cell,row) => {
          return row.selectedDate ? row.selectedDate.toDate().toDateString(): '';
        }
      },
      notes: {
        title: 'Notes',
        width: '25%',
        valuePrepareFunction: (cell,row) => {
          return this.beautifyNotes(row.accomplishments);
        }
      },
      start: {
        title: 'Start',
        width: '8%',
        valuePrepareFunction: (cell,row) => {
            return row.start;
        }
      },
      break: {
        title: 'Break',
        width: '8%',
        valuePrepareFunction: (cell,row) => {
            return row.break;
        }
      },
      finish: {
        title: 'Finish',
        width: '8%',
        valuePrepareFunction: (cell,row) => {
            return row.finish;
        }
      },
      // entry_status: {
      //   title: 'Status',
      //   width: '10%',
      //   valuePrepareFunction: (cell,row) => {
      //       return row.entry_status + ' ' + (row.modified_by ? "(modified by "+row.modified_by+")" : "") + ' ' + (row.modified_date ? "(updated last "+moment(row.modified_date).format('MM/DD/YYYY')+")" : "");
      //   }
      // },
    }
  };

  public dashboardSearchWorkerSettings = {
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
    columns: {
      worker_name: {
        title: 'Name',
        width: '15%',
        valuePrepareFunction: (cell,row) => {
          return this.filterWorkers.find(o => o.id === row.workerID)?.userFirstName + ' ' +this.filterWorkers.find(o => o.id === row.workerID)?.userLastName;
        }
      },
      project_name: {
        title: 'Project',
        width: '15%',
        valuePrepareFunction: (cell,row) => {
          return this.projectNames.find(o => o.id === row.projectId)?.projectName;
        }
      },
      entry_date: {
        title: 'Entry Date',
        width: '15%',
        valuePrepareFunction: (cell,row) => {
          return row.selectedDate ? row.selectedDate.toDate().toDateString(): '';
        }
      },
      notes: {
        title: 'Notes',
        width: '25%',
        valuePrepareFunction: (cell,row) => {
            return this.beautifyNotes(row.accomplishments);
        }
      },
      start: {
        title: 'Start',
        width: '8%',
        valuePrepareFunction: (cell,row) => {
            return row.start;
        }
      },
      break: {
        title: 'Break',
        width: '8%',
        valuePrepareFunction: (cell,row) => {
            return row.break;
        }
      },
      finish: {
        title: 'Finish',
        width: '8%',
        valuePrepareFunction: (cell,row) => {
            return row.finish;
        }
      },
      // entry_status: {
      //   title: 'Status',
      //   width: '10%',
      //   valuePrepareFunction: (cell,row) => {
      //       return row.entry_status + ' ' + (row.modified_by ? "(modified by "+row.modified_by+")" : "") + ' ' + (row.modified_date ? "(updated last "+moment(row.modified_date).format('MM/DD/YYYY')+")" : "");
      //   }
      // },
    }
  };

  public dashboardSearchSupervisorDailySettings = {
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
    columns: {
      customactions: {
        width: '120px',
        title: 'Action',
        type : 'html',
        filter: false,
        valuePrepareFunction: (cell,row) => {
          return `<a target="_blank" href="#/daily-report/project/${row.projectId}?date=${this.formatDate(row.todaysDate)}"><i class="material-icons">preview</i></a>
          `;
        }
      },
      project_name: {
        title: 'Project Name',
        valuePrepareFunction: (cell,row) => {
          return this.projectNames.find(o => o.id === row.projectId)?.projectName;
        }
      },
      entry_date: {
        title: 'Entry Date',
        valuePrepareFunction: (cell,row) => {
          return row.todaysDate ? row.todaysDate.toDate().toDateString(): '';
        }
      },
      num_of_trades: {
        title: 'Trades On Site',
        valuePrepareFunction: (cell,row) => {
          return this.countNumber(row.tradeFormArray);
        }
      },
      num_of_staff: {
        title: 'Staff On Site',
        valuePrepareFunction: (cell,row) => {
          return this.countNumber(row.staffFormArray);
        }
      },
      num_of_visitors: {
        title: 'Visitors On Site',
        valuePrepareFunction: (cell,row) => {
          return this.countNumber(row.visitorFormArray);
        }
      },
    }
  };

  public dashboardSearchTradesDailySettings = {
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
    columns: {
      customactions: {
        width: '120px',
        title: 'Action',
        type : 'html',
        filter: false,
        valuePrepareFunction: (cell,row) => {
          return `<a target="_blank" href="#/daily-report/project/${row.projectId}?date=${this.formatDate(row.todaysDate)}"><i class="material-icons">preview</i></a>
          `;
        }
      },
      project_name: {
        title: 'Project Name',
        valuePrepareFunction: (cell,row) => {
          return this.projectNames.find(o => o.id === row.projectId)?.projectName;
        }
      },
      entry_date: {
        title: 'Entry Date',
        valuePrepareFunction: (cell,row) => {
          return row.todaysDate ? row.todaysDate.toDate().toDateString(): '';
        }
      },
      num_of_trades: {
        title: 'Trades On Site',
        valuePrepareFunction: (cell,row) => {
          return this.countNumber(row.tradeFormArray);
        }
      },
      num_of_staff: {
        title: 'Staff On Site',
        valuePrepareFunction: (cell,row) => {
          return this.countNumber(row.staffFormArray);
        }
      },
      num_of_visitors: {
        title: 'Visitors On Site',
        valuePrepareFunction: (cell,row) => {
          return this.countNumber(row.visitorFormArray);
        }
      },
    }
  };

  filterLogsForm: FormGroup;

  public filterUsers = [];
  public filterWorkers = [];
  public filterSupervisors = [];
  public filterTrades = [];

  searchChoices = [
      {value: 'entry_date', viewValue: 'Entry Date'},
      {value: 'project_id', viewValue: 'Project'},
      {value: 'supervisor_id', viewValue: 'Supervisor'},
      {value: 'worker_id', viewValue: 'Workers'},
      {value: 'trades_id', viewValue: 'Trades'},
    ]
  
  recentDailyReportImages = [];
  recentWeeklyReportImages = [];
  recentWorkerImages = [];
  recentWorkerEntries = [];

  galleryOptionsDaily: NgxGalleryOptions[];
  galleryOptionsWorker: NgxGalleryOptions[];
  galleryDailyReportImages: NgxGalleryImage[];
  galleryWeeklyReportImages: NgxGalleryImage[];
  galleryWorkerImages: NgxGalleryImage[];

  public userDetails;
  public sortDashboard = [];
  
  adminData;

  colorBtnDefault;

  constructor(
    private data_api: DatasourceService,
    private formBuilder: FormBuilder,
    // private spinnerService: Ng4LoadingSpinnerService,
    public dialog: MatDialog,
    private renderer2: Renderer2,
    private e: ElementRef,
    private rolechecker: RoleChecker,
    private spinnerService: NgxLoadingSpinnerService,
    private router: Router,
    private myService: MyService,
    public authService: AuthenticationService,
    private afStorage: AngularFireStorage,
    private progressOverlay: NgxProgressOverlayService,
    private afs: AngularFirestore
    ) { }

  public ngOnInit() {
    this.getAdminSettings();
    // this.validateToken();
    // this.rolechecker.check(4);
    // this.getDasboardWorkerLogs();
    // this.getAllUsers();

    if (localStorage.getItem('currentUser')) {
      this.userDetails = JSON.parse(localStorage.getItem('currentUser'));
      console.log(this.userDetails);
    }
    
    this.arrangeDashboard();

      this.galleryOptionsDaily = [
          { 
            "image": false,  width: '100%', "height": "400px", "imageSize": "700px", 
            thumbnailsColumns: 12, 
            "thumbnailsRows": 2, 
            // "previewDownload": true, 
            "arrowPrevIcon": "fa fa-arrow-circle-o-left", 
            "arrowNextIcon": "fa fa-arrow-circle-o-right",
            imageAnimation: NgxGalleryAnimation.Slide ,
            actions : [{icon: 'fa fa-download', onClick: this.downloadImageDaily.bind(this), titleText: 'download'}]
          },
          {
            breakpoint: 1200,
            thumbnailsColumns: 6,
          },
          {
            breakpoint: 1000,
            thumbnailsColumns: 5,
          },
          {
              breakpoint: 800,
              thumbnailsColumns: 4,
          },
          {
            breakpoint: 600,
            thumbnailsColumns: 2,
          },
          {
              breakpoint: 400,
              thumbnailsColumns: 1,
          }
      ];

      this.galleryOptionsWorker = [
        { 
          "image": false,  width: '100%', "height": "400px", "imageSize": "700px", 
          thumbnailsColumns: 12, 
          "thumbnailsRows": 2, 
          // "previewDownload": true, 
          "arrowPrevIcon": "fa fa-arrow-circle-o-left", 
          "arrowNextIcon": "fa fa-arrow-circle-o-right",
          imageAnimation: NgxGalleryAnimation.Slide ,
          actions : [{icon: 'fa fa-download', onClick: this.downloadImageWorker.bind(this), titleText: 'download'}]
        },
        {
          breakpoint: 1200,
          thumbnailsColumns: 6,
        },
        {
          breakpoint: 1000,
          thumbnailsColumns: 5,
        },
        {
            breakpoint: 800,
            thumbnailsColumns: 4,
        },
        {
          breakpoint: 600,
          thumbnailsColumns: 2,
        },
        {
            breakpoint: 400,
            thumbnailsColumns: 1,
        }
    ];

    this.getFBWorkers();
    this.getFBProjects();
    // this.getFBRecent();
  
    this.filterLogsForm = this.formBuilder.group({
        entryDate: [''],
        projectID: [''],
        workerID: [''],
        supervisorID: [''],
        tradesID: [''],
    });

      this.accountFirebase = this.data_api.getCurrentProject();

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

  onButtonEnter2(hoverName: HTMLElement) {
    hoverName.style.color = this.adminData.colourHoveredButton ?  this.adminData.colourHoveredButton: '';
    console.log(hoverName);
  }

  onButtonOut2(hoverName: HTMLElement) {
      hoverName.style.color = this.adminData.colourEnabledButton ?  this.adminData.colourEnabledButton: '';
  }

  downloadImageDaily(event, index): void {
      console.log(event);
      console.log(index);
      console.log(this.galleryDailyReportImages[index].url)

      this.getBase64ImageFromURL(this.galleryDailyReportImages[index].url).subscribe((base64Data: string) => {   
            
        const element = document.createElement('a');
        element.href = base64Data;
        element.download = 'image.jpg';
        element.style.display = 'none';
        element.click();

      });

  }

  downloadImageWorker(event, index): void {
      console.log(event);
      console.log(index);
      console.log(this.galleryWorkerImages[index].url)

      this.getBase64ImageFromURL(this.galleryWorkerImages[index].url).subscribe((base64Data: string) => {   
            
        const element = document.createElement('a');
        element.href = base64Data;
        element.download = 'image.jpg';
        element.style.display = 'none';
        element.click();

      });

  }

  orderUp(index){
    console.log(this.sortDashboard);
    console.log(index);
     [this.sortDashboard[index - 1], this.sortDashboard[index]] = [this.sortDashboard[index], this.sortDashboard[index -1]];
    console.log(this.sortDashboard);

    this.data_api.updateFBUserSortDashboard(this.userDetails.user_id,this.sortDashboard).then(() => {
      console.log('success');
    }); 

  }

  orderDown(index){
    console.log(this.sortDashboard);
    console.log(index);
     [this.sortDashboard[index + 1], this.sortDashboard[index]] = [this.sortDashboard[index], this.sortDashboard[index +1]];
    console.log(this.sortDashboard);

    this.data_api.updateFBUserSortDashboard(this.userDetails.user_id,this.sortDashboard).then(() => {
      console.log('success');
    }); 
  }
  
  arrangeDashboard(){

    if(this.userDetails.user_id){
      this.data_api.getFBUser(this.userDetails.user_id).subscribe((data) => {

            if(data.sortDashboard){
              this.sortDashboard = data.sortDashboard
              //this.sortDashboard[0] = daily report
              //this.sortDashboard[1] = weekly report
              //this.sortDashboard[2] = worker entry
              //this.sortDashboard[3] = projects
              //this.sortDashboard[4] = images daily report
              //this.sortDashboard[4] = images weekly report
              //this.sortDashboard[4] = images worker entry
              console.log(this.sortDashboard);
            }else{
              this.sortDashboard = ["dly","wkly","wrkr","proj","imgdly","imgwrkr"]
            }

        }
      );
    }

    
    
  }

  // convertImages(){
  //   if(this.recentDailyReportImages.length > 0){
  //       let i = 0;
  //       for (let img of this.recentDailyReportImages) {
  //         // const myForm =  (<FormArray>this.editForm.get("imageUpload")).at(i);
  //         // const awaitData = this.getBase64ImageFromURL(img.imageFile).subscribe((base64Data: string) => {   return base64Data}); 
  //         // myForm.patchValue({
  //         //   imageCaption: i,
  //         // });

  //         this.getBase64ImageFromURL(img.url).subscribe((base64Data: string) => {  
  //             console.log(base64Data);
  //             this.recentDailyReportImages[i].big = base64Data;
  //             this.recentDailyReportImages[i].medium = base64Data;
  //             this.recentDailyReportImages[i].small = base64Data;
  //             this.recentDailyReportImages[i].url = base64Data;
  //             // this.imageURLRaw[i] = base64Data;
  //             // myForm.patchValue({
  //             //   imageFile: base64Data,
  //             // });
  //         });

  //         i++;

  //       }
  //   }
  // }

  getBase64ImageFromURL(url: string): Observable<string> {
    return Observable.create((observer: Observer<string>) => {
      // create an image object
      let img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = url;
      if (!img.complete) {
        // This will call another method that will create image from url
        img.onload = () => {
          observer.next(this.getBase64Image(img));
          observer.complete();
        };
        img.onerror = err => {
          observer.error(err);
        };
      } else {
        observer.next(this.getBase64Image(img));
        observer.complete();
      }
    });
  }

  getBase64Image(img: HTMLImageElement): string {
    // We create a HTML canvas object that will create a 2d image
    var canvas: HTMLCanvasElement = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    let ctx: CanvasRenderingContext2D = canvas.getContext("2d");
    // This will draw image
    ctx.drawImage(img, 0, 0);
    // Convert the drawn image to Data URL
    let dataURL: string = canvas.toDataURL("image/jpeg");
    return dataURL;
    // this.base64DefaultURL = dataURL;
    // return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
  }

  getFBRecent(){

    this.data_api.getFBRecentDailyReportSupervisor().subscribe(dataDailyReports => {
        console.log(dataDailyReports);

        if(dataDailyReports){
            this.dashboardDailyReportList = [];
            this.galleryDailyReportImages = [];
            this.recentDailyReportImages = [];

            dataDailyReports.forEach(data =>{ 
                this.dashboardDailyReportList.push(data)
            })
            dataDailyReports.forEach(data =>{ 
              if(data.imageUpload){
                data.imageUpload.forEach(async image => {

                  let imageText = '';
                  imageText += this.projectNames.find(o => o.id === data.projectId)?.projectName;
                  if(image.imageCaption){
                    imageText += " - "+ image.imageCaption
                  }
                  if(image.imageStamp){
                    imageText += " - uploaded at "+ image.imageStamp.toDate()
                  }

                  this.recentDailyReportImages.push(
                  {
                    small: image.imageFile,
                    medium: image.imageFile,
                    big: image.imageFile,
                    url: image.imageFile,
                    description: imageText
                  }); 
                
                  // await this.getBase64ImageFromURL(image.imageFile).subscribe((base64Data: string) => {   
                        
                  //     this.recentDailyReportImages.push(
                  //       {
                  //         small: image.imageFile,
                  //         medium: image.imageFile,
                  //         big: base64Data,
                  //         url: base64Data,
                  //         description: imageText
                  //       }); 

                  // });
                

                });
              }

            })
            this.galleryDailyReportImages = this.recentDailyReportImages;
        }
    });


    this.data_api.getFBRecentWeeklyReportSupervisor().subscribe(dataWeeklyReports => {
        console.log(dataWeeklyReports);

        if(dataWeeklyReports){
            this.dashboardWeeklyReportList = [];
            dataWeeklyReports.forEach(data =>{ 
                this.dashboardWeeklyReportList.push(data)
            })
        }
    });

    this.getFBRecentWorkerEntryLogsSupervisor();

    // this.data_api.getFBRecentWorkerEntryLogs().pipe(first()).subscribe(dataWorkerEntryLogs => {
    //     console.log(dataWorkerEntryLogs);

    //     if(dataWorkerEntryLogs){
    //         this.dashboardWorkerList = [];
    //         this.galleryWorkerImages = [];
    //         this.recentWorkerImages = [];

    //         dataWorkerEntryLogs.forEach(data =>{ 
    //             this.dashboardWorkerList.push(data)
    //         })

    //         dataWorkerEntryLogs.forEach(data =>{ 
    //           if(data.imageUpload){
    //             data.imageUpload.forEach(async image => {

    //               let imageText = '';
    //               imageText += this.projectNames.find(o => o.id === data.projectId)?.projectName;
    //               if(image.imageCaption){
    //                 imageText += " - "+ image.imageCaption
    //               }
    //               if(image.imageStamp){
    //                 imageText += " - uploaded at "+ image.imageStamp.toDate()
    //               }
          
    //               this.recentWorkerImages.push(
    //                 {
    //                   small: image.imageFile,
    //                   medium: image.imageFile,
    //                   big: image.imageFile,
    //                   url: image.imageFile,
    //                   description: imageText
    //                 }); 

    //               // await this.getBase64ImageFromURL(image.imageFile).subscribe((base64Data: string) => {   
                        
    //               //       this.recentWorkerImages.push(
    //               //         {
    //               //           small: image.imageFile,
    //               //           medium: image.imageFile,
    //               //           big: base64Data,
    //               //           url: base64Data,
    //               //           description: imageText
    //               //         }); 

    //               //   });

    //             });
    //           }
    //         })
    //         this.galleryWorkerImages = this.recentWorkerImages;
    //     }

    // });
  }

  async  getFBRecentWorkerEntryLogsSupervisor(){

      if (!this.supervisorProjects || !this.supervisorProjects.length ) return [];

      console.log(this.userDetails.user_id);
      console.log(this.supervisorProjects);
      let batches = [];

      while (this.supervisorProjects.length) {
        const batch = this.supervisorProjects.splice(0, 10);
        console.log(batch);

        const data = await this.data_api.getFBRecentWorkerEntryLogsSupervisor(batch).pipe(take(1)).toPromise();
            console.log(data);
    
            if(data){
              //  this.dashboardDailyReportList = [];
              data.forEach(data2 =>{  
                    if(data2){
                      batches.push(data2)
                    }
                    
                })
            }
            

      }
        // });
      batches = batches.sort((a, b) => b.createdAt - a.createdAt) 
      batches = batches.splice(0, 10);
      
      this.dashboardWorkerList = new LocalDataSource(batches)

      batches.forEach(data =>{ 
          if(data.imageUpload){
            data.imageUpload.forEach(async image => {

              let imageText = '';
              imageText += this.projectNames.find(o => o.id === data.projectId)?.projectName;
              if(image.imageCaption){
                imageText += " - "+ image.imageCaption
              }
              if(image.imageStamp){
                imageText += " - uploaded at "+ image.imageStamp.toDate()
              }
      
              this.recentWorkerImages.push(
                {
                  small: image.imageFile,
                  medium: image.imageFile,
                  big: image.imageFile,
                  url: image.imageFile,
                  description: imageText
                }); 


            });
          }
      })
      this.galleryWorkerImages = this.recentWorkerImages;
      console.log(this.galleryWorkerImages);
    

    //   this.supervisorProjects.forEach(async projectId =>{ 
    //       console.log(projectId);

    //       await this.data_api.getFBRecentWorkerEntryLogsSupervisor(projectId).pipe().subscribe(data => {
    //           console.log(data);
      
    //           if(data){
    //             //  this.dashboardDailyReportList = [];
    //             data.forEach(data2 =>{  
    //                   if(data2){
    //                     batches.push(data2)
    //                   }
                      
    //               })
    //           }
    //       });
    //   })

    // this.dashboardWorkerList = new LocalDataSource(batches);

      // while (this.supervisorProjects.length) {

      //   const batch = this.supervisorProjects.splice(0, 10);

      //   // const awaitData = await this.data_api.getFBRecentWorkerEntryLogsSupervisor(batch).get(); 

      //   // console.log(awaitData);

      //   var list = await this.data_api.getFBRecentWorkerEntryLogsSupervisor(batch).subscribe(data => {
      //       console.log(data);
      //       return data
      //       // data.forEach(data2 =>{ 
      //       //   batches.push(data2)
      //       // })
      //   });
      //   console.log(list);
      //   // batches.push(

      //   //   this.afs.collection('/accounts').doc(this.accountFirebase).collection('/timesheet', ref => ref
      //   //       .where('projectId', 'in', [...batch])
      //   //   )
      //   //   .then(results => results.docs.map(result => ({ /* id: result.id, */ ...result.data() }) ))

      //   // )

      // }
      // this.dashboardWorkerList = new LocalDataSource(batches)
      // console.log(batches);
  }

  getFBProjects() {
      
      this.data_api.getFBRecentProjects().subscribe(data => {
        console.log(data);
        let projectList = [];
        this.projectNames = [];
          if(data){
            data.forEach(data2 =>{ 
              projectList.push(data2)

              if(data2.siteSupervisor){
                if(data2.siteSupervisor == this.userDetails.user_id){
                    this.supervisorProjects.push(data2.id);
                }
              }

            })

            this.dashboardProjectsList = projectList.slice(0, 5);

            this.projectNames = projectList;

            this.projectNames.sort(function(a, b) {
                var textA = a.projectName.toUpperCase();
                var textB = b.projectName.toUpperCase();
                return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
            });

            console.log(this.projectNames);

            
          }

          this.getFBRecent();

      });

  }

  public getFBWorkers(): void {
    if(this.filterWorkers.length < 1){
        this.spinnerService.show();
        this.data_api.getFBWorkers().subscribe(data => {
          console.log(data);

            if(data){

              this.spinnerService.hide();
              
              data.forEach(data =>{ 

                if(!data.password){

                  this.filterWorkers.push(data)

                }

              })
            }
        });
    }
  }

  public getFBSupervisors(): void {
    if(this.filterSupervisors.length < 1){
        this.spinnerService.show();
        this.data_api.getFBSupervisors().subscribe(data => {
          console.log(data);

            if(data){

              this.spinnerService.hide();
              
              data.forEach(data =>{ 
                  if(!data.password){
                    this.filterSupervisors.push(data)
                  }
              })
            }
        });
    }
  }

  getFBAllTrades(): void {
    if(this.filterTrades.length < 1){
      this.spinnerService.show();
      this.data_api.getFBAllTrades().subscribe(data => {
        console.log(data);

          if(data){
            this.spinnerService.hide();
            
                data.sort(function(a, b) {
                    var textA = a.tradeCompanyName.toUpperCase();
                    var textB = b.tradeCompanyName.toUpperCase();
                    return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
                });

                data.forEach(data =>{ 
                    this.filterTrades.push(data)
                })
          }

      });
    }
  }

  public reset(){
    this.filterLogsForm.reset();

    this.dashboardSearchDateDailyReportList = [];
    this.dashboardSearchDateWeeklyReportList = [];
    this.dashboardSearchDateWorkerList = [];
    this.dashboardSearchSupervisorDailyList = [];

    this.dashboardSearchProjectList = []; 
    this.dashboardSearchProjectDailyList = [];
    this.dashboardSearchProjectWeeklyList = [];
    this.dashboardSearchProjectWorkerList = [];

    this.dashboardSearchWorkerList = []; 

    this.dashboardSearchTradesDailyList = [];

  }

  public filterByChange(event){
    console.log(event.value);
    if(event.value == 'entry_date'){
        // this.getFBWorkers();
    }else if(event.value == 'project_id'){
        // this.getFBWorkers();
    }else if(event.value == 'worker_id'){
        // this.getFBWorkers();
    }else if(event.value == 'trades_id'){
        this.getFBAllTrades();
    }else if(event.value == 'supervisor_id'){
        this.getFBSupervisors();
    }
  }

  public filterLogs(){
      
        console.log(this.filterLogsForm.value);
        this.dashboardSearchDateDailyReportList = [];
        this.dashboardSearchDateWeeklyReportList = [];
        this.dashboardSearchDateWorkerList = [];
        this.dashboardSearchSupervisorDailyList = [];
        
        this.dashboardSearchProjectList = []; 
        this.dashboardSearchProjectDailyList = [];
        this.dashboardSearchProjectWeeklyList = [];
        this.dashboardSearchProjectWorkerList = [];

        this.dashboardSearchWorkerList = []; 

        this.dashboardSearchTradesDailyList = [];

        this.dashboardSearchWorkerId = [];
        this.dashboardSearchTradesDailyId = [];
        

      if( this.filterLogsForm.value.entryDate){
        
          this.data_api.getFBDashboardSearchDateDailyReport(this.filterLogsForm.value.entryDate).subscribe(data => {
            console.log(data);
              if (data.length > 0){
                  data.forEach(data =>{ 
                      this.dashboardSearchDateDailyReportList.push(data)
                  })
              }
          });

          this.data_api.getFBDashboardSearchDateWeeklyReport(this.filterLogsForm.value.entryDate).subscribe(data => {
            console.log(data);
              if (data.length > 0){
                  data.forEach(data =>{ 
                      this.dashboardSearchDateWeeklyReportList.push(data)
                  })
              }
          });

          this.data_api.getFBDashboardSearchDateWorker(this.filterLogsForm.value.entryDate).subscribe(data => {
            console.log(data);
              if (data.length > 0){
                  data.forEach(data =>{ 
                      this.dashboardSearchDateWorkerList.push(data)
                  })
              }
          });

      }else if( this.filterLogsForm.value.projectID){


        if(this.projectNames){
        
          let selectedProject = this.projectNames.find(o => o.id ===this.filterLogsForm.value.projectID);
          console.log(selectedProject);
          if(selectedProject){
            this.dashboardSearchProjectList.push(selectedProject);
          }
          
        }

        this.data_api.getFBDashboardSearchProjectDailyReport(this.filterLogsForm.value.projectID).subscribe(data => {
          console.log(data);
            if (data.length > 0){
                data.forEach(data =>{ 
                    this.dashboardSearchProjectDailyList.push(data)
                })
            }
        });

        this.data_api.getFBDashboardSearchProjectWeeklyReport(this.filterLogsForm.value.projectID).subscribe(data => {
          console.log(data);
            if (data.length > 0){
                data.forEach(data =>{ 
                    this.dashboardSearchProjectWeeklyList.push(data)
                })
            }
        });

        this.data_api.getFBDashboardSearchProjectWorker(this.filterLogsForm.value.projectID).subscribe(data => {
          console.log(data);
            if (data.length > 0){
                data.forEach(data =>{ 
                    this.dashboardSearchProjectWorkerList.push(data)
                })
            }
        });

      }else if( this.filterLogsForm.value.supervisorID){

        // this.data_api.getFBDashboardSearchWorkerTimesheet(this.filterLogsForm.value.workerID).subscribe(data => {
        //   console.log(data);
        // });
        this.dashboardSearchSupervisorDailyId = this.filterLogsForm.value.supervisorID;
        this.getFBDashboardSearchSupervisorReport();


      }else if( this.filterLogsForm.value.workerID){

        // this.data_api.getFBDashboardSearchWorkerTimesheet(this.filterLogsForm.value.workerID).subscribe(data => {
        //   console.log(data);
        // });
        this.dashboardSearchWorkerId = this.filterLogsForm.value.workerID;
        this.getFBDashboardSearchWorkerTimesheet();

      }else if( this.filterLogsForm.value.tradesID){

        // this.data_api.getFBDashboardSearchTradeReport(this.filterLogsForm.value.tradesID).subscribe(data => {
        //   console.log(data);
        // });
        this.dashboardSearchTradesDailyId = this.filterLogsForm.value.tradesID;
        this.getFBDashboardSearchTradeReport();

      }
      // this.spinnerService.show();
      // this.data_api.getFBDashboardSearch(this.filterLogsForm.value).subscribe((data) => {            
      //     }else if( this.filterLogsForm.value.workerID){
      //       if (data[0].length > 0){
      //         data[0].forEach(data =>{ 
      //             this.dashboardSearchWorkerList.push(data)
      //         })
      //       }
      //     }else if( this.filterLogsForm.value.tradesID){
      //       if (data[0].length > 0){
      //         data[0].forEach(data =>{ 
      //             this.dashboardSearchTradesDailyList.push(data)
      //         })
      //       }

      //     }
      //   this.spinnerService.hide();
      // })
  }

  //Search Worker
  getFBDashboardSearchWorkerTimesheet(){
    this.afs.collection('/accounts').doc(this.accountFirebase).collection('/timesheet', ref => ref
    .orderBy('selectedDate', 'desc')
    .where("workerID", '==', this.dashboardSearchWorkerId)
    .limit(10)
    ).snapshotChanges()
    .subscribe(response => {
      if (!response.length) {
      console.log("No Data Available");
      return false;
      }
      console.log(response);
  
      this.searchWorkerFirstInResponse = response[0].payload.doc;
      this.searchWorkerLastInResponse = response[response.length - 1].payload.doc;
  
      this.searchWorkerTableData = [];
      for (let item of response) {
        let tempdata = {
          id: item.payload.doc.id,
          ...item.payload.doc.data()
        }
        this.searchWorkerTableData.push(tempdata);
      }
      console.log(this.searchWorkerTableData);

      this.dashboardSearchWorkerList = this.searchWorkerTableData;
  
      //Initialize values
      this.searchWorkerPrev_strt_at = [];
      this.searchWorkerPagination_clicked_count = 0;
      this.searchWorkerDisable_next = false;
      this.searchWorkerDisable_prev = false;
  
      //Push first item to use for Previous action
      this.searchWorkerPush_prev_startAt(this.searchWorkerFirstInResponse);
      }, error => {
        console.log(error);
      });
  
  }

  //Add document
  searchWorkerPush_prev_startAt(prev_first_doc) {
    this.searchWorkerPrev_strt_at.push(prev_first_doc);
  }

  //Remove not required document 
  searchWorkerPop_prev_startAt(prev_first_doc) {
    this.searchWorkerPrev_strt_at.forEach(element => {
      if (prev_first_doc.data().id == element.data().id) {
        element = null;
      }
    });
  }
  
  //Return the Doc rem where previous page will startAt
  searchWorkerGet_prev_startAt() {
    if (this.searchWorkerPrev_strt_at.length > (this.searchWorkerPagination_clicked_count + 1))
      this.searchWorkerPrev_strt_at.splice(this.searchWorkerPrev_strt_at.length - 2, this.searchWorkerPrev_strt_at.length - 1);
    return this.searchWorkerPrev_strt_at[this.searchWorkerPagination_clicked_count - 1];
  }

  //Show next set 
  searchWorkerNextPage() {
    this.searchWorkerDisable_next = true;
    this.afs.collection('/accounts').doc(this.accountFirebase).collection('/timesheet', ref => ref
      .limit(10)
      .where("workerID", '==', this.dashboardSearchWorkerId)
      .orderBy('selectedDate', 'desc')
      .startAfter(this.searchWorkerLastInResponse)
    ).get()
      .subscribe(response => {

        if (!response.docs.length) {
          this.searchWorkerDisable_next = true;
          return;
        }

        this.searchWorkerFirstInResponse = response.docs[0];

        this.searchWorkerLastInResponse = response.docs[response.docs.length - 1];
        this.searchWorkerTableData = [];
        for (let item of response.docs) {
          this.searchWorkerTableData.push(item.data());
        }
        this.dashboardSearchWorkerList = this.searchWorkerTableData;

        this.searchWorkerPagination_clicked_count++;

        this.searchWorkerPush_prev_startAt(this.searchWorkerFirstInResponse);

        this.searchWorkerDisable_next = false;
      }, error => {
        this.searchWorkerDisable_next = false;
      });
  }

  //Show previous set 
  searchWorkerPrevPage() {
    this.searchWorkerDisable_prev = true;
    this.afs.collection('/accounts').doc(this.accountFirebase).collection('/timesheet', ref => ref
      .orderBy('selectedDate', 'desc')
      .where("workerID", '==', this.dashboardSearchWorkerId)
      .startAt(this.searchWorkerGet_prev_startAt())
      .endBefore(this.searchWorkerFirstInResponse)
      .limit(10)
    ).get()
      .subscribe(response => {
        this.searchWorkerFirstInResponse = response.docs[0];
        this.searchWorkerLastInResponse = response.docs[response.docs.length - 1];
        
        this.searchWorkerTableData = [];
        for (let item of response.docs) {
          this.searchWorkerTableData.push(item.data());
        }

        this.dashboardSearchWorkerList = this.searchWorkerTableData;

        //Maintaing page no.
        this.searchWorkerPagination_clicked_count--;

        //Pop not required value in array
        this.searchWorkerPush_prev_startAt(this.searchWorkerFirstInResponse);

        //Enable buttons again
        this.searchWorkerDisable_prev = false;
        this.searchWorkerDisable_next = false;
      }, error => {
        this.searchWorkerDisable_prev = false;
      });
  }

  //Search Supervisor
  getFBDashboardSearchSupervisorReport(){
    this.afs.collection('/accounts').doc(this.accountFirebase).collection('/dailyReport', ref => ref
    .orderBy('todaysDate', 'desc')
    .where("staffIdArray", 'array-contains', this.dashboardSearchSupervisorDailyId)
    .limit(10)
    ).snapshotChanges()
    .subscribe(response => {
      if (!response.length) {
      console.log("No Data Available");
      return false;
      }
      console.log(response);

      this.searchSupervisorFirstInResponse = response[0].payload.doc;
      this.searchSupervisorLastInResponse = response[response.length - 1].payload.doc;

      this.searchSupervisorTableData = [];
      for (let item of response) {
      this.searchSupervisorTableData.push(item.payload.doc.data());
      }

      this.dashboardSearchSupervisorDailyList = this.searchSupervisorTableData;

      //Initialize values
      this.searchSupervisorPrev_strt_at = [];
      this.searchSupervisorPagination_clicked_count = 0;
      this.searchSupervisorDisable_next = false;
      this.searchSupervisorDisable_prev = false;

      //Push first item to use for Previous action
      this.searchSupervisorPush_prev_startAt(this.searchSupervisorFirstInResponse);
      }, error => {
        console.log(error);
      });

  }

    //Add document
    searchSupervisorPush_prev_startAt(prev_first_doc) {
      this.searchSupervisorPrev_strt_at.push(prev_first_doc);
    }
  
    //Remove not required document 
    searchSupervisorPop_prev_startAt(prev_first_doc) {
      this.searchSupervisorPrev_strt_at.forEach(element => {
        if (prev_first_doc.data().id == element.data().id) {
          element = null;
        }
      });
    }
    
    //Return the Doc rem where previous page will startAt
    searchSupervisorGet_prev_startAt() {
      if (this.searchSupervisorPrev_strt_at.length > (this.searchSupervisorPagination_clicked_count + 1))
        this.searchSupervisorPrev_strt_at.splice(this.searchSupervisorPrev_strt_at.length - 2, this.searchSupervisorPrev_strt_at.length - 1);
      return this.searchSupervisorPrev_strt_at[this.searchSupervisorPagination_clicked_count - 1];
    }
  
    //Show next set 
    searchSupervisorNextPage() {
      this.searchSupervisorDisable_next = true;
      this.afs.collection('/accounts').doc(this.accountFirebase).collection('/dailyReport', ref => ref
        .limit(10)
        .where("staffIdArray", 'array-contains', this.dashboardSearchSupervisorDailyId)
        .orderBy('todaysDate', 'desc')
        .startAfter(this.searchSupervisorLastInResponse)
      ).get()
        .subscribe(response => {
  
          if (!response.docs.length) {
            this.searchSupervisorDisable_next = true;
            return;
          }
  
          this.searchSupervisorFirstInResponse = response.docs[0];
  
          this.searchSupervisorLastInResponse = response.docs[response.docs.length - 1];
          this.searchSupervisorTableData = [];
          for (let item of response.docs) {
            this.searchSupervisorTableData.push(item.data());
          }
          this.dashboardSearchSupervisorDailyList = this.searchSupervisorTableData;
  
          this.searchSupervisorPagination_clicked_count++;
  
          this.searchSupervisorPush_prev_startAt(this.searchSupervisorFirstInResponse);
  
          this.searchSupervisorDisable_next = false;
        }, error => {
          this.searchSupervisorDisable_next = false;
        });
    }
  
    //Show previous set 
    searchSupervisorPrevPage() {
      this.searchSupervisorDisable_prev = true;
      this.afs.collection('/accounts').doc(this.accountFirebase).collection('/dailyReport', ref => ref
        .orderBy('todaysDate', 'desc')
        .where("staffIdArray", 'array-contains', this.dashboardSearchSupervisorDailyId)
        .startAt(this.searchSupervisorGet_prev_startAt())
        .endBefore(this.searchSupervisorFirstInResponse)
        .limit(10)
      ).get()
        .subscribe(response => {
          this.searchSupervisorFirstInResponse = response.docs[0];
          this.searchSupervisorLastInResponse = response.docs[response.docs.length - 1];
          
          this.searchSupervisorTableData = [];
          for (let item of response.docs) {
            this.searchSupervisorTableData.push(item.data());
          }
  
          this.dashboardSearchSupervisorDailyList = this.searchSupervisorTableData;
  
          //Maintaing page no.
          this.searchSupervisorPagination_clicked_count--;
  
          //Pop not required value in array
          this.searchSupervisorPush_prev_startAt(this.searchSupervisorFirstInResponse);
  
          //Enable buttons again
          this.searchSupervisorDisable_prev = false;
          this.searchSupervisorDisable_next = false;
        }, error => {
          this.searchSupervisorDisable_prev = false;
        });
    }

    
  //Search Trade
  getFBDashboardSearchTradeReport(){
    this.afs.collection('/accounts').doc(this.accountFirebase).collection('/dailyReport', ref => ref
    .orderBy('todaysDate', 'desc')
    .where("tradesIdArray", 'array-contains', this.dashboardSearchTradesDailyId)
    .limit(10)
    ).snapshotChanges()
    .subscribe(response => {
      if (!response.length) {
      console.log("No Data Available");
      return false;
      }
      console.log(response);
  
      this.searchTradesFirstInResponse = response[0].payload.doc;
      this.searchTradesLastInResponse = response[response.length - 1].payload.doc;
  
      this.searchTradesTableData = [];
      for (let item of response) {
      this.searchTradesTableData.push(item.payload.doc.data());
      }
  
      this.dashboardSearchTradesDailyList = this.searchTradesTableData;
  
      //Initialize values
      this.searchTradesPrev_strt_at = [];
      this.searchTradesPagination_clicked_count = 0;
      this.searchTradesDisable_next = false;
      this.searchTradesDisable_prev = false;
  
      //Push first item to use for Previous action
      this.searchTradesPush_prev_startAt(this.searchTradesFirstInResponse);
      }, error => {
        console.log(error);
      });
  
  }

  //Add document
  searchTradesPush_prev_startAt(prev_first_doc) {
    this.searchTradesPrev_strt_at.push(prev_first_doc);
  }

  //Remove not required document 
  searchTradesPop_prev_startAt(prev_first_doc) {
    this.searchTradesPrev_strt_at.forEach(element => {
      if (prev_first_doc.data().id == element.data().id) {
        element = null;
      }
    });
  }
  
  //Return the Doc rem where previous page will startAt
  searchTradesGet_prev_startAt() {
    if (this.searchTradesPrev_strt_at.length > (this.searchTradesPagination_clicked_count + 1))
      this.searchTradesPrev_strt_at.splice(this.searchTradesPrev_strt_at.length - 2, this.searchTradesPrev_strt_at.length - 1);
    return this.searchTradesPrev_strt_at[this.searchTradesPagination_clicked_count - 1];
  }

  //Show next set 
  searchTradesNextPage() {
    this.searchTradesDisable_next = true;
    this.afs.collection('/accounts').doc(this.accountFirebase).collection('/dailyReport', ref => ref
      .limit(10)
      .where("tradesIdArray", 'array-contains', this.dashboardSearchTradesDailyId)
      .orderBy('todaysDate', 'desc')
      .startAfter(this.searchTradesLastInResponse)
    ).get()
      .subscribe(response => {

        if (!response.docs.length) {
          this.searchTradesDisable_next = true;
          return;
        }

        this.searchTradesFirstInResponse = response.docs[0];

        this.searchTradesLastInResponse = response.docs[response.docs.length - 1];
        this.searchTradesTableData = [];
        for (let item of response.docs) {
          this.searchTradesTableData.push(item.data());
        }
        this.dashboardSearchTradesDailyList = this.searchTradesTableData;

        this.searchTradesPagination_clicked_count++;

        this.searchTradesPush_prev_startAt(this.searchTradesFirstInResponse);

        this.searchTradesDisable_next = false;
      }, error => {
        this.searchTradesDisable_next = false;
      });
  }

  //Show previous set 
  searchTradesPrevPage() {
    this.searchTradesDisable_prev = true;
    this.afs.collection('/accounts').doc(this.accountFirebase).collection('/dailyReport', ref => ref
      .orderBy('todaysDate', 'desc')
      .where("tradesIdArray", 'array-contains', this.dashboardSearchTradesDailyId)
      .startAt(this.searchTradesGet_prev_startAt())
      .endBefore(this.searchTradesFirstInResponse)
      .limit(10)
    ).get()
      .subscribe(response => {
        this.searchTradesFirstInResponse = response.docs[0];
        this.searchTradesLastInResponse = response.docs[response.docs.length - 1];
        
        this.searchTradesTableData = [];
        for (let item of response.docs) {
          this.searchTradesTableData.push(item.data());
        }

        this.dashboardSearchTradesDailyList = this.searchTradesTableData;

        //Maintaing page no.
        this.searchTradesPagination_clicked_count--;

        //Pop not required value in array
        this.searchTradesPush_prev_startAt(this.searchTradesFirstInResponse);

        //Enable buttons again
        this.searchTradesDisable_prev = false;
        this.searchTradesDisable_next = false;
      }, error => {
        this.searchTradesDisable_prev = false;
      });
  }

  // public getDasboardWorkerLogs(){
  //     this.spinnerService.show();

  //     this.data_api.getDashboardWidgetList().subscribe((data) => {
  //       console.log(data);
  //       this.dashboardWorkerList = [];
  //       this.dashboardDailyReportList = [];
  //       this.dashboardWeeklyReportList = [];
  //       this.dashboardProjectsList = [];
  //       this.dashboardTradesList = [];
  //       this.dashboardUsersList = [];

  //       if (data[0].length > 0){
  //         data[0].forEach(data =>{ 
  //             this.dashboardWorkerList.push(data)
  //         })
  //       }

  //       if (data[1].length > 0){
  //         data[1].forEach(data =>{ 
  //             this.dashboardDailyReportList.push(data)
  //         })
  //       }

  //       if (data[2].length > 0){
  //         data[2].forEach(data =>{ 
  //             this.dashboardWeeklyReportList.push(data)
  //         })
  //       }

  //       if (data[3].length > 0){
  //         data[3].forEach(data =>{ 
  //             this.dashboardProjectsList.push(data)
  //         })
  //       }

  //       if (data[4].length > 0){
  //         data[4].forEach(data =>{ 
  //             this.dashboardTradesList.push(data)
  //         })
  //       }

  //       if (data[5].length > 0){
  //         data[5].forEach(data =>{ 
  //             this.dashboardUsersList.push(data)
  //         })
  //       }

  //       if (data[6].length > 0){
  //         data[6].forEach(data =>{ 
  //           this.projectNames.push(data)
  //         })
  //       }

  //       if (data[7].length > 0){
  //         data[7].forEach(data =>{ 
  //           this.filterTrades.push(data)
  //         })
  //       }
        
  //       this.spinnerService.hide();
         
  //     });
  // }

  // public getAllUsers(){
  //   this.data_api.getAllUsers().subscribe((data) => {
           
  //           console.log(data);
  //           data.forEach(data =>{ 
  //               //this.filterUsers.push(data)
  //               //console.log(data.meta.admin_role)
  //               if(data.meta.admin_role == 'project_worker'){
  //                 this.filterWorkers.push(data)
  //               }
                
  //           })
  //           console.log(this.filterWorkers);
  //     }
  //   );
  // }

  public beautifyNotes(data) {

      if(data){
        return data.join(', ');  
      }else{
        return;
      }
          
  }

  public formatDate(date) {
      var d = new Date(date.toDate()),
          month = '' + (d.getMonth() + 1),
          day = '' + d.getDate(),
          year = d.getFullYear();

      if (month.length < 2) 
          month = '0' + month;
      if (day.length < 2) 
          day = '0' + day;

      return [year, month, day].join('-');
      //return [day, month, year].join('/');
  }

  public countNumber(data) {
      let count = data;
      if (count){
        return count.length;
      }else{
        return 0;
      }
      
  }

  // public validateToken(){
  //   this.spinnerService.show();
  //     this.data_api.checkToken().subscribe((data) => {
  //         console.log(data);
  //         if(data.code =='jwt_auth_valid_token'){
  //             return;
  //         }else{

  //           this.spinnerService.hide();

  //           swal.fire({
  //               title: "Session Expired.",
  //               text: "Please log in again.",
  //               buttonsStyling: false,
  //               customClass: {
  //                 confirmButton: 'btn btn-success',
  //               },
  //               icon: "error"
  //           }).then((result) => {
  //             this.authService.logout();
  //           })

  //         }
  //     },
  //     (error) =>{

  //       console.log(error);
  //       if(error.error.code == "jwt_auth_invalid_token"){
  //         this.spinnerService.hide();
  //         swal.fire({
  //             title: "Session Expired.",
  //             text: "Please log in again.",
  //             buttonsStyling: false,
  //             customClass: {
  //               confirmButton: 'btn btn-success',
  //             },
  //             icon: "error"
  //         }).then((result) => {
  //           this.authService.logout();
  //           })

  //       }else{
  //         this.spinnerService.hide();
  //         swal.fire({
  //             title: error.error.message,
  //             // text: "You clicked the button!",
  //             buttonsStyling: false,
  //             customClass: {
  //               confirmButton: 'btn btn-success',
  //             },
  //             icon: "error"
  //         })

  //       } 


  //       }
  //     );

  // }

}

