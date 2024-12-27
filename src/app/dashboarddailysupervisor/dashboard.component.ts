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
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import swal from 'sweetalert2';
import { RoleChecker } from '../services/role-checker.service';
import { NgxLoadingSpinnerService } from '@k-adam/ngx-loading-spinner';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {MyService} from '../services/image-upload-service'; 
import { DailyRenderSupervisorComponent } from './dailybutton-render.component';
import { AuthenticationService } from '../shared/authentication.service';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { take, takeUntil } from 'rxjs/operators';
import { MatSelect } from '@angular/material/select';
import { ReplaySubject, Subject } from 'rxjs';

declare const $: any;

@Component({
  selector: 'app-dashboarddailysupervisor',
  templateUrl: './dashboard.component.html'
})
export class DashboardDailySupervisorComponent {

  weeklySource: LocalDataSource = new LocalDataSource;
  dailySource: LocalDataSource = new LocalDataSource;

  public reportList = [];
  public reportLast;
  supervisorProjects=[];

  doneRunning = false;

  selectedMode: boolean = true;
  // This will contain selected rows
  selectedRows = [];
  filterWeeklyReports: FormGroup;
  public projectNames = [];
  public siteSupervisors = [];

  public selected: any

  //Data object for listing items
  tableData: any[] = [];

  //Save first document in snapshot of items received
  firstInResponse: any = [];

  //Save last document in snapshot of items received
  lastInResponse: any = [];

  //Keep the array of first document of previous pages
  prev_strt_at: any = [];

  //Maintain the count of clicks on Next Prev button
  pagination_clicked_count = 0;

  //Disable next and prev buttons
  disable_next: boolean = false;
  disable_prev: boolean = false;
  
  selectedProject;

  accountFirebase;

  searchChoices = [
    {value: 'entry_date', viewValue: 'Entry Date'},
    {value: 'project_id', viewValue: 'Project'},
    {value: 'supervisor_id', viewValue: 'Supervisor'},
    {value: 'has_image', viewValue: 'Uploaded Images'},
  ]

  imageBoolean = [
    {value: 'true', viewValue: 'Yes'},
    {value: 'false', viewValue: 'No'},
  ]

  public dailyReportSettings = {
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
        width: '120px',
        title: 'Action',
        type : 'custom',
        filter: false,
        sort: false,
        valuePrepareFunction: (cell, row) => {
          return this.projectNames.find(o => o.id === row.projectId).projectName;
        },
        renderComponent: DailyRenderSupervisorComponent
        // valuePrepareFunction: (cell,row) => {
        //   return `<a href="#/daily-report/project/${row.projectId}?date=${this.formatDate2(row.todaysDate.toDate())}"><i class="material-icons">preview</i></a>
        //   <a target="_blank" href="${row.pdfLink}"><i class="material-icons">picture_as_pdf</i></a>
        //   `;
        // }
      },
      // id: {
      //   title: 'ID',
      //   valuePrepareFunction: (cell,row) => {
      //     return row.id;
      //   }
      // },
      project_name: {
        sort: false,
        width: '300px',
        title: 'Project Name',
        valuePrepareFunction: (cell,row) => {
            return this.projectNames.find(o => o.id === row.projectId).projectName;
        }
      },
      entry_date: {
        sort: false,
        title: 'Entry Date',
        valuePrepareFunction: (cell,row) => {
            return row.todaysDate.toDate().toDateString();
        }
      },
      // supervisor_name: {
      //   title: 'Supervisor Name',
      //   valuePrepareFunction: (cell,row) => {
      //       return row.supervisor_name;
      //   }
      // },
      num_of_trades: {
        sort: false,
        title: 'Trades On Site',
        valuePrepareFunction: (cell,row) => {
          return this.countNumber(row.tradeFormArray);
        }
      },
      num_of_staff: {
        sort: false,
        title: 'Staff On Site',
        valuePrepareFunction: (cell,row) => {
          return (this.countNumber(row.staffFormArray)) + (row.staffCount ? row.staffCount : 0);
        }
      },
      num_of_visitors: {
        sort: false,
        title: 'Visitors On Site',
        valuePrepareFunction: (cell,row) => {
          return this.countNumber(row.visitorFormArray);
        }
      },
      // customdelaction: {
      //   width: '80px',
      //   title: '',
      //   type : 'custom',
      //   filter: false,
      //   valuePrepareFunction: (cell, row) => row,
      //   renderComponent: DailyRenderComponent
      // },
      // image_size : {
      //   title: 'Total Size of Images',
      //   valuePrepareFunction: (cell,row) => {
      //       return this.formatBytes(row.total_file_size);
      //   }
      // },
    }
  };

  adminData;

  colorBtnDefault;

  userDetails;

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
    private afs: AngularFirestore
    ) { }

  public ngOnInit() {
      //this.validateToken();
      //this.rolechecker.check(4)
      // this.getWeeklyReports();
      this.getAdminSettings();
      this.filterWeeklyReports = this.formBuilder.group({
          entryDate: [''],
          projectID: [''],
          supervisorId: [''],
          hasImage: [''],
      });

      if (localStorage.getItem('currentUser')) {
          this.userDetails = JSON.parse(localStorage.getItem('currentUser'));
      }

      this.accountFirebase = this.data_api.getCurrentProject();

      this.getFBProjects();
      //this.getSupervisors();
      // this.getFBDailyReports();
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

  async getFBDailyReports(){
      console.log(this.selectedProject);
      this.afs.collection('/accounts').doc(this.accountFirebase).collection('/dailyReport', ref => ref
      .where("projectId", '==', this.selectedProject.id)
      .orderBy('todaysDate', 'desc')
      .limit(10)
      ).snapshotChanges()
      .subscribe(response => {
          if (!response.length) {
            console.log("No Data Available");
            return false;
          }
          console.log(response);

          this.firstInResponse = response[0].payload.doc;
          this.lastInResponse = response[response.length - 1].payload.doc;

          this.tableData = [];
          for (let item of response) {
            const itemData = item.payload.doc.data();
            itemData.id = item.payload.doc.id;
            this.tableData.push(itemData);
            //this.tableData.push(item.payload.doc.data());
          }

          this.dailySource = new LocalDataSource(this.tableData)
          console.log(this.dailySource);
          //Initialize values
          this.prev_strt_at = [];
          this.pagination_clicked_count = 0;
          this.disable_next = false;
          this.disable_prev = false;

          //Push first item to use for Previous action
          this.push_prev_startAt(this.firstInResponse);
          }, error => {
            console.log('eroore',error)
          });

  }

  //Add document
  push_prev_startAt(prev_first_doc) {
    this.prev_strt_at.push(prev_first_doc);
  }

  //Remove not required document 
  pop_prev_startAt(prev_first_doc) {
    this.prev_strt_at.forEach(element => {
      if (prev_first_doc.data().id == element.data().id) {
        element = null;
      }
    });
  }

  //Return the Doc rem where previous page will startAt
  get_prev_startAt() {
    if (this.prev_strt_at.length > (this.pagination_clicked_count + 1))
      this.prev_strt_at.splice(this.prev_strt_at.length - 2, this.prev_strt_at.length - 1);
    return this.prev_strt_at[this.pagination_clicked_count - 1];
  }

  nextPage() {
    this.disable_next = true;
    this.afs.collection('/accounts').doc(this.accountFirebase).collection('/dailyReport', ref => ref
      .where("projectId", '==', this.selectedProject.id)
      .limit(10)
      .orderBy('todaysDate', 'desc')
      .startAfter(this.lastInResponse)
    ).get()
      .subscribe(response => {

        if (!response.docs.length) {
          this.disable_next = true;
          return;
        }

        this.firstInResponse = response.docs[0];

        this.lastInResponse = response.docs[response.docs.length - 1];
        this.tableData = [];
        for (let item of response.docs) {
          const itemData = item.data();
          itemData.id = item.id;
          this.tableData.push(itemData);
          // this.tableData.push(item.data());
        }
        this.dailySource = new LocalDataSource(this.tableData)

        console.log(this.dailySource);

        this.pagination_clicked_count++;

        this.push_prev_startAt(this.firstInResponse);

        this.disable_next = false;
      }, error => {
        this.disable_next = false;
      });
  }

  //Show previous set 
  prevPage() {
    this.disable_prev = true;
    this.afs.collection('/accounts').doc(this.accountFirebase).collection('/dailyReport', ref => ref
      .where("projectId", '==', this.selectedProject.id)
      .orderBy('todaysDate', 'desc')
      .startAt(this.get_prev_startAt())
      .endBefore(this.firstInResponse)
      .limit(10)
    ).get()
      .subscribe(response => {
        this.firstInResponse = response.docs[0];
        this.lastInResponse = response.docs[response.docs.length - 1];
        
        this.tableData = [];
        for (let item of response.docs) {
          const itemData = item.data();
            itemData.id = item.id;
            this.tableData.push(itemData);
          //this.tableData.push(item.data());
        }
        this.dailySource = new LocalDataSource(this.tableData)
        //Maintaing page no.
        this.pagination_clicked_count--;

        //Pop not required value in array
        this.pop_prev_startAt(this.firstInResponse);

        //Enable buttons again
        this.disable_prev = false;
        this.disable_next = false;
      }, error => {
        this.disable_prev = false;
      });
  }

  getFBProjects(): void {
   if(this.userDetails.userRole == 'project_supervisor'){
    this.getSupervisorsProject();
   } else if(this.userDetails.userRole == 'project_owner'){
    this.clientProject();
   }

  }

  getSupervisorsProject(){
    this.data_api.getFBProjects().subscribe(data => {
      console.log(data);

      this.supervisorProjects = [];
      let tempSupervisorProjects = [];
      data.forEach(data2 =>{ 
          this.projectNames.push(data2)

          if(data2.siteSupervisor){
            if(data2.siteSupervisor == this.userDetails.user_id){  
                tempSupervisorProjects.push(data2);
            }

            if(data2.altSupervisor){
              if(data2.altSupervisor.includes( this.userDetails.user_id)){ 
                  tempSupervisorProjects.push(data2);
              }
            }

            const uniqueID = new Map(
              tempSupervisorProjects.map(c => [c.id, c])
            );
            
            this.supervisorProjects = [...uniqueID.values()];
            
          }

      })

      console.log(this.supervisorProjects);
      if(this.doneRunning == false){
        this.doneRunning = true;
        this.openDailyProjectSelect();
      }
      

    });
  }

  
  clientProject(){
    this.data_api.getFBProjects().subscribe(data => {
      console.log(data);
      this.supervisorProjects = [];
      let tempSupervisorProjects = [];
      data.forEach(data2 =>{ 
          this.projectNames.push(data2)
          console.log('data2', data2)

          if(data2.clientEmail){
            if(data2.clientEmail.includes(this.userDetails.firebase.identities.email[0])){
              console.log('this is working')
              console.log('data', data2)
                tempSupervisorProjects.push(data2);
            }
          //  console.log('data2', data2)
            // if(data2.altSupervisor){
            //   if(data2.altSupervisor.includes( this.userDetails.user_id)){
            //       tempSupervisorProjects.push(data2);
            //   }
            // }

            const uniqueID = new Map(
              tempSupervisorProjects.map(c => [c.id, c])
            );
            
            this.supervisorProjects = [...uniqueID.values()];
            
          }


      })
      console.log('tempsuper',tempSupervisorProjects)


      console.log(this.supervisorProjects);

      if(this.doneRunning == false){
        this.doneRunning = true;
        this.openDailyProjectSelect();
      }
      // this.getFBDailyReports();
    })
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


  public formatDate(date) {
      var d = new Date(date+'T00:00'),
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

  public countNumber(data) {
      let count = data;
      if (count){
        return count.length;
      }else{
        return 0;
      }
      
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


  // public getSupervisors(){
  //       this.spinnerService.show();

  //       this.data_api.getProjectSupervisors().subscribe((data) => {
  //           data.forEach(data =>{ 
  //               this.siteSupervisors.push(data)
  //           })
  //       });
  // }

  // public getWeeklyReports(){
  //       this.spinnerService.show();

  //       this.data_api.getWeeklyReports().subscribe((data) => {
  //           this.weeklySource.load(data);
  //           this.reportList = data;
  //           this.spinnerService.hide();
  //           console.log(this.reportList);

  //           this.selectedMode = false;
  //           setTimeout(() => {
  //             this.disableCheckboxes();
  //           }, 1000);
  //           // this.disableCheckboxes();

  //       });
  // }

//   public newfilterWeeklyReports(val){
//     console.log(val)     
//     if(val){
//       this.spinnerService.show();
//       this.data_api.filterWeeklyReports(val).subscribe((data) => {
//         console.log(data);
//         this.weeklySource.load(data);
//         this.reportList = data;
//         this.spinnerService.hide();
//         console.log(this.reportList);
//         this.spinnerService.hide();
//       });
//     }else{
//       this.getWeeklyReports();
//     }

// }



  // public filterDailyReports(val){
  //     console.log(val)     
  //     if(val){
  //       this.spinnerService.show();
  //       this.data_api.filterDailyReports(val).subscribe((data) => {
  //         console.log(data);
  //         this.dailySource.load(data);
  //         this.spinnerService.hide();
  //       });
  //     }else{
  //       this.getDailyReports();
  //     }

  // }

  public getDailyReports(){
      this.spinnerService.show();

      this.data_api.getDailyReports().subscribe((data) => {
        console.log(data);
          this.dailySource.load(data);
          // this.reportList = data;
          this.spinnerService.hide();
          // console.log(this.reportList);

          this.selectedMode = false;
          // setTimeout(() => {
          //   this.disableCheckboxes();
          // }, 1000);
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

      this.data_api.getWeeklyReportsQuery(this.filterWeeklyReports.value).subscribe((data) => {
        console.log(data);
        this.weeklySource.load(data);
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

    openDailyProjectSelect(): void {


      const dialogRef = this.dialog.open(DailyProjectSelectDialog, {
          width: '400px',
          data: this.supervisorProjects
      });

      dialogRef.afterClosed().subscribe(result => {

        console.log(result);
        if(result){ 
          this.selectedProject = result.projectId
          this.getFBDailyReports();
        }

      });

    }

    // openDailyDateSelect(): void {

    //     const dialogRef = this.dialog.open(DailyDateSelectDialog, {
    //         width: '400px',
    //         // data: this.renderValue
    //     });

    //     dialogRef.afterClosed().subscribe(result => {
    //         console.log(result);
    //         if(result){
    //           let selectedDate = result.date;
    //           let selecteddd = String(selectedDate.getDate()).padStart(2, '0');
    //           let selectedmm = String(selectedDate.getMonth() + 1).padStart(2, '0'); //January is 0!
    //           let selectedyyyy = selectedDate.getFullYear();

    //           let selecteddateToday = selectedyyyy + '-' + selectedmm + '-' + selecteddd;

    //           this.router.navigate(['/daily-report/project/'+result.project], { queryParams: { date: selecteddateToday } });
    //         }
    //     });
    // }


}


@Component({
  selector: 'daily-project-select-dialog',
  templateUrl: 'daily-project-select-dialog.html',
})

export class DailyProjectSelectDialog implements OnInit {

  addFestForm: FormGroup;
  
  public projectNames;
  public adminData;
  public colorBtnDefault;

  public filter_list_projects: ReplaySubject<[]> = new ReplaySubject<[]>(1);

  public search_control_project: FormControl = new FormControl();

  @ViewChild('singleSelect', { static: true }) singleSelect: MatSelect;
  
  protected _onDestroy = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<DailyProjectSelectDialog>,
    private data_api: DatasourceService,
    private spinnerService: NgxLoadingSpinnerService,
    @Inject(MAT_DIALOG_DATA) public data) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  get g(){
    return this.addFestForm.controls;
  }
  
  ngOnInit() {
    this.addFestForm = this.formBuilder.group({
      projectId: ['', Validators.required]
    }, {
    });    
    this.projectNames = this.data;
    this.initializeFilterProjects();
    this.getAdminSettings();
    // this.getActiveProjects();
  }
  
  selectProject(){
 

      if (this.addFestForm.invalid) {
        swal.fire({
            title: "Please select a project!",
            // text: "You clicked the button!",
            buttonsStyling: false,
            customClass: {
              confirmButton: 'btn btn-success',
            },
            icon: "error"
        })
        return;
    } 
    this.dialogRef.close(this.addFestForm.value);
  }

  initializeFilterProjects() {
    
    this.filter_list_projects.next(this.projectNames.slice());

      this.search_control_project.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.filterListProjects();
      });

  }

  protected filterListProjects() {
      if (!this.projectNames) {
        return;
      }
      // get the search keyword
      let search = this.search_control_project.value;
      if (!search) {
        this.filter_list_projects.next(this.projectNames.slice());
        return;
      } else {
        search = search.toLowerCase();
      }
      // filter the banks
      this.filter_list_projects.next(
        this.projectNames.filter(projectName => projectName.projectName.toLowerCase().indexOf(search) > -1)
      );
  }
    
  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
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


// @Component({
//   selector: 'daily-date-select-dialog',
//   templateUrl: 'daily-date-select-dialog.html',
// })

// export class DailyDateSelectDialog implements OnInit {

//   addFestForm: FormGroup;
//   public listProjects;

//   constructor(
//     private formBuilder: FormBuilder,
//     public dialogRef: MatDialogRef<DailyDateSelectDialog>,
//     private data_api: DatasourceService,
//     private spinnerService: NgxLoadingSpinnerService,
//     @Inject(MAT_DIALOG_DATA) public data) {}

//   onNoClick(): void {
//     this.dialogRef.close();
//   }

//   get g(){
//     return this.addFestForm.controls;
//   }
  
//   ngOnInit() {
//     this.addFestForm = this.formBuilder.group({
//       project: ['', Validators.required],
//       date: ['', Validators.required],
//     }, {
//     });
//     this.getActiveProjects();
//   }

//   public getActiveProjects(){
//     this.spinnerService.show();

//       this.data_api.getActiveProjects().subscribe((data) => {

//           this.listProjects = data;
//           this.spinnerService.hide();
//       });
//   }

  
// }