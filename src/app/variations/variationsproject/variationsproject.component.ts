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
import { LocalDataSource } from 'ng2-smart-table';
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
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { VariationsProjectRenderComponent } from './variationsproject-render.component';

declare const $: any;

@Component({
  selector: 'app-variationsproject',
  templateUrl: './variationsproject.component.html',
  providers: [
    {provide: DateAdapter, useClass: AppDateAdapter},
    {provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS},
    DatePipe
  ]
})
export class VariationsProjectComponent implements OnInit {

    source: LocalDataSource = new LocalDataSource;
    public passID: any;
    
    public selected: any

    projectData;

    filterVariationsForm: FormGroup;

    searchChoices = [
      {value: 'status', viewValue: 'Status'},
      {value: 'due_date', viewValue: 'Due Date'},
    ]

    varStatus = [
      {value: 'Approved', viewValue: 'Approved'},
      {value: 'Draft', viewValue: 'Draft'},
      {value: 'Rejected', viewValue: 'Rejected'},
      {value: 'Submitted to Admin', viewValue: 'Submitted to Admin'},
      {value: 'Submitted to Client', viewValue: 'Submitted to Client'},
      {value: 'Undecided', viewValue: 'Undecided'},
    ]

    public settings = {
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
            width: '100px',
            title: 'Action',
            type : 'custom',
            filter: false,
            sort: false,
            valuePrepareFunction: (cell, row) => {
              console.log('row', row);
              
              return this.passID.id;
            },
            renderComponent: VariationsProjectRenderComponent
            // valuePrepareFunction: (cell,row) => {
            //   return `<a href="#/daily-report/project/${row.projectId}?date=${this.formatDate2(row.todaysDate.toDate())}"><i class="material-icons">preview</i></a>
            //   <a target="_blank" href="${row.pdfLink}"><i class="material-icons">picture_as_pdf</i></a>
            //   `;
            // }
          },
          // customactions: {
          //   title: 'Action',
          //   width: '100px',
          //   type : 'html',
          //   filter: false,
          //   valuePrepareFunction: (cell,row) => {
          //     if(row.status == 'Approved'){
          //       return `<a class="color-approved"  href="#/variations/project/${this.passID.id}/edit/${row.id}"><i class="material-icons">edit_square</i></a>
          //               <a target="_blank" href="${row.pdfLink}"><i class="material-icons">download</i></a>
          //               <a [routerLink]="[]" (click)="openDeleteDialog()"><i class="material-icons">delete</i></a>`;
          //     }else{
          //       return `<a href="#/variations/project/${this.passID.id}/edit/${row.id}"><i class="material-icons">edit</i></a>
          //               <a target="_blank" href="${row.pdfLink}"><i class="material-icons">download</i></a>
          //               <a [routerLink]="[]" (click)="openDeleteDialog()"><i class="material-icons">delete</i></a>`;
          //     }
              
          //   }
          // },
          variation_num: {
            title: 'Variation Number',
            sort: false,
            valuePrepareFunction: (cell,row) => {
                return row.variantsNumber;
            }
          },
          variation_name: {
            title: 'Variation Name',
            sort: false,
            valuePrepareFunction: (cell,row) => {
                return row.variationsName;
            }
          },
          total: {
            title: 'Total',
            sort: false,
            valuePrepareFunction: (cell,row) => {
                return this.getTotal(row.variationGroupArray);
            }
          },
          due_date: {
            title: 'Due Date',
            sort: false,
            valuePrepareFunction: (cell,row) => {
                return row.dueDate ? row.dueDate.toDate().toDateString() : '';
            }
          },
          status: {
            title: 'Status',
            sort: false,
            valuePrepareFunction: (cell,row) => {
                return row.status;
            }
          },
          created_date: {
            title: 'Created Date',
            sort: false,
            valuePrepareFunction: (cell,row) => {
                return row.createdAt ? row.createdAt.toDate().toDateString() : '';
            }
          },
          
          // default_hours: {
          //   title: 'Default Hours',
          //   valuePrepareFunction: (cell,row) => {
          //       return row.default_hours;
          //   }
          // },
        }
      };

      accountFirebase;

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

        public variationSearchStatus = [];
        public variationSearchDueDate = [];

        public listmode = 'default';

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
        private afs: AngularFirestore
        // private imageCompress: NgxImageCompressService
        ) { }

    ngOnInit() {
      console.log('source', this.source);
        
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

        this.accountFirebase = this.data_api.getCurrentProject();

        // if (localStorage.getItem('currentUser')) {
        //     this.userDetails = JSON.parse(localStorage.getItem('currentUser'));
        // }

        // this.addFestForm = this.formBuilder.group({
        //     tradeCompanyName: ['', Validators.required],
        //     trade: [''],
        //     tradeName: [''],
        //     tradeEmail: [''],
        //     tradePhone: [''],
        //     tradedefaultCostcode: [''],
        //     staffFormArray: this.formBuilder.array([ this.createStaffForm() ]),
        // });
        //   this.getFBTrade();
         this.getVariations();
         this.getProject();

         this.filterVariationsForm = this.formBuilder.group({
            status: [''],
            dueDate: [''],
        });
    }

    getAdminSettings(){
      this.data_api.getFBAdminSettings().subscribe((data) => {
          this.adminData = data;
          this.colorBtnDefault = data.colourEnabledButton ? data.colourEnabledButton : '';
      }); 
    }

    onButtonEnter(hoverName: HTMLElement) {
      
      hoverName.style.backgroundColor = this.adminData.colourHoveredButton ?  this.adminData.colourHoveredButton: '';
      
    }

    onButtonOut(hoverName: HTMLElement) {
        hoverName.style.backgroundColor = this.adminData.colourEnabledButton ?  this.adminData.colourEnabledButton: '';
  }

    // public getVariations(){
    //   this.data_api.getFBVariations(this.passID.id).subscribe(data => {
    //       console.log(data);
    //       //this.source = data;
    //       this.source.load(data);
    //   });

    // }
    getTotal(variationGroupArray){
      let total = 0;
      for (let group of variationGroupArray) { 
        total = total + parseFloat(group.groupTotal)
      }
      return total;
    }

    getProject(){
      this.data_api.getFBProject(this.passID.id).pipe(first()).subscribe(data => {          
          this.projectData = data;
      });
    }

    filterVariations(){

      if( this.filterVariationsForm.value.status){
        this.listmode = 'filter-status';
        this.getVariationsFilterStatus();
      }else if( this.filterVariationsForm.value.dueDate){
        this.listmode = 'filter-duedate';
        this.getVariationsFilterDueDate();
  
      }
      
    }

    // SEARCH BY NAME
    searchByNameFilterVariation(event: any) {
      console.log('event', event.target.value.length);
  
      let query;
    
      // Check if the name filter exists and apply it to the query
      if (event.target.value.length > 0) {
          query = this.afs.collection('/accounts').doc(this.accountFirebase)
              .collection('/variations', ref => ref
                  .where("projectId", '==', this.passID.id)
                  .where("variationsName", "==", event.target.value)
                  // .where("variationsName", "==", event.target.value + '\uf8ff') // For case-insensitive search
                  // .orderBy("variationsName") // First order by "name" since we're filtering it with an inequality
                  // .orderBy("variantsNumber", 'desc') // Then order by "variantsNumber" for descending order
                  .limit(10)
              );`                   `
      } else {
        // If no name filter is applied, fallback to a default query
        query = this.afs.collection('/accounts').doc(this.accountFirebase)
            .collection('/variations', ref => ref
                .where("projectId", '==', this.passID.id)
                .orderBy("variantsNumber", 'desc')  // For ordering variations by number or any other criteria
                .limit(10)
            );
    }
  
      // Execute the query and handle the response
      query.snapshotChanges()
          .subscribe(response => {
            console.log('resposne', response);
            
              if (!response.length) {
                  this.source = new LocalDataSource();
                  return false;
              }
  
              this.firstInResponse = response[0].payload.doc;
              this.lastInResponse = response[response.length - 1].payload.doc;
  
              this.tableData = [];
              for (let item of response) {
                  const itemData = item.payload.doc.data();
                  itemData.id = item.payload.doc.id;
                  this.tableData.push(itemData);
              }
  
              this.source = new LocalDataSource(this.tableData);
              this.prev_strt_at = [];
              this.pagination_clicked_count = 0;
              this.disable_next = false;
              this.disable_prev = false;
  
              this.push_prev_startAt(this.firstInResponse);
          }, error => {
              console.error(error);
          });
  }
  
    //Filter Status
    getVariationsFilterStatus(){

          this.afs.collection('/accounts').doc(this.accountFirebase).collection('/variations', ref => ref
          .where("projectId", '==', this.passID.id)
          .where("status", '==', this.filterVariationsForm.value.status)
          .orderBy("variantsNumber", 'desc')
          .limit(10)
          ).snapshotChanges()
          .subscribe(response => {
              if (!response.length) {
              
                this.source = new LocalDataSource();
                return false;
              }

              this.firstInResponse = response[0].payload.doc;
              this.lastInResponse = response[response.length - 1].payload.doc;

              this.tableData = [];
              for (let item of response) {
                const itemData = item.payload.doc.data();
                itemData.id = item.payload.doc.id;
                this.tableData.push(itemData);
                //this.tableData.push(item.payload.doc.data());
              }

              this.source = new LocalDataSource(this.tableData)
              //Initialize values
              this.prev_strt_at = [];
              this.pagination_clicked_count = 0;
              this.disable_next = false;
              this.disable_prev = false;

              //Push first item to use for Previous action
              this.push_prev_startAt(this.firstInResponse);
              }, error => {
              });

      }

      //Add document
      push_prev_startAtFilterStatus(prev_first_doc) {
        this.prev_strt_at.push(prev_first_doc);
      }

      //Remove not required document 
      pop_prev_startAtFilterStatus(prev_first_doc) {
        this.prev_strt_at.forEach(element => {
          if (prev_first_doc.data().id == element.data().id) {
            element = null;
          }
        });
      }

      //Return the Doc rem where previous page will startAt
      get_prev_startAtFilterStatus() {
        if (this.prev_strt_at.length > (this.pagination_clicked_count + 1))
          this.prev_strt_at.splice(this.prev_strt_at.length - 2, this.prev_strt_at.length - 1);
        return this.prev_strt_at[this.pagination_clicked_count - 1];
      }

      nextPageFilterStatus() {
        this.disable_next = true;
        this.afs.collection('/accounts').doc(this.accountFirebase).collection('/variations', ref => ref
          .limit(10)
          .where("projectId", '==', this.passID.id)
          .where("status", '==', this.filterVariationsForm.value.status)
          .orderBy("variantsNumber", 'desc')
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
            this.source = new LocalDataSource(this.tableData)


            this.pagination_clicked_count++;

            this.push_prev_startAt(this.firstInResponse);

            this.disable_next = false;
          }, error => {
            this.disable_next = false;
          });
      }

      //Show previous set 
      prevPageFilterStatus() {
        this.disable_prev = true;
        this.afs.collection('/accounts').doc(this.accountFirebase).collection('/variations', ref => ref
          .where("projectId", '==', this.passID.id)
          .where("status", '==', this.filterVariationsForm.value.status)
          .orderBy("variantsNumber", 'desc')
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
            this.source = new LocalDataSource(this.tableData)
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


    //Filter Due Date
    getVariationsFilterDueDate(){

        var startDate = new Date(this.filterVariationsForm.value.dueDate) ;
        var endDate = new Date(this.filterVariationsForm.value.dueDate);
        endDate.setDate(startDate.getDate() + 1);
        this.afs.collection('/accounts').doc(this.accountFirebase).collection('/variations', ref => ref
        .where("projectId", '==', this.passID.id)
        .where("dueDate", '>=', startDate)
        .where("dueDate", '<', endDate)
        .orderBy("variantsNumber", 'desc')
        .limit(10)
        ).snapshotChanges()
        .subscribe(response => {
            if (!response.length) {
              this.source = new LocalDataSource();
              return false;
            }

            this.firstInResponse = response[0].payload.doc;
            this.lastInResponse = response[response.length - 1].payload.doc;

            this.tableData = [];
            for (let item of response) {
              const itemData = item.payload.doc.data();
              itemData.id = item.payload.doc.id;
              this.tableData.push(itemData);
              //this.tableData.push(item.payload.doc.data());
            }

            this.source = new LocalDataSource(this.tableData)
            //Initialize values
            this.prev_strt_at = [];
            this.pagination_clicked_count = 0;
            this.disable_next = false;
            this.disable_prev = false;

            //Push first item to use for Previous action
            this.push_prev_startAt(this.firstInResponse);
            }, error => {
            });

    }

    //Add document
    push_prev_startAtFilterDueDate(prev_first_doc) {
      this.prev_strt_at.push(prev_first_doc);
    }

    //Remove not required document 
    pop_prev_startAtFilterDueDate(prev_first_doc) {
      this.prev_strt_at.forEach(element => {
        if (prev_first_doc.data().id == element.data().id) {
          element = null;
        }
      });
    }

    //Return the Doc rem where previous page will startAt
    get_prev_startAtFilterDueDate() {
      if (this.prev_strt_at.length > (this.pagination_clicked_count + 1))
        this.prev_strt_at.splice(this.prev_strt_at.length - 2, this.prev_strt_at.length - 1);
      return this.prev_strt_at[this.pagination_clicked_count - 1];
    }

    nextPageFilterDueDate() {

      var startDate = new Date(this.filterVariationsForm.value.dueDate) ;
      var endDate = new Date(this.filterVariationsForm.value.dueDate);
      endDate.setDate(startDate.getDate() + 1);

      this.disable_next = true;
      this.afs.collection('/accounts').doc(this.accountFirebase).collection('/variations', ref => ref
        .limit(10)
        .where("projectId", '==', this.passID.id)
        .where("dueDate", '>=', startDate)
        .where("dueDate", '<', endDate)
        .orderBy("variantsNumber", 'desc')
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
          this.source = new LocalDataSource(this.tableData);
          this.pagination_clicked_count++;

          this.push_prev_startAt(this.firstInResponse);

          this.disable_next = false;
        }, error => {
          this.disable_next = false;
        });
    }

    //Show previous set 
    prevPageFilterDueDate() {

      var startDate = new Date(this.filterVariationsForm.value.dueDate) ;
      var endDate = new Date(this.filterVariationsForm.value.dueDate);
      endDate.setDate(startDate.getDate() + 1);

      this.disable_prev = true;
      this.afs.collection('/accounts').doc(this.accountFirebase).collection('/variations', ref => ref
        .where("projectId", '==', this.passID.id)
        .where("dueDate", '>=', startDate)
        .where("dueDate", '<', endDate)
        .orderBy("variantsNumber", 'desc')
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
          this.source = new LocalDataSource(this.tableData)
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

    // Default 

    getVariations(){
      console.log('prejctId', this.passID.id);
      console.log('this.accountFirebase', this.accountFirebase);
      console.log('prejctId', this.passID.id);
      
      this.afs.collection('/accounts').doc(this.accountFirebase).collection('/variations', ref => ref
      .where("projectId", '==', this.passID.id)
      .orderBy("variantsNumber", 'desc')
      .limit(10)
      ).snapshotChanges()
      .subscribe(response => {
          if (!response.length) {
            return false;
          }

          this.firstInResponse = response[0].payload.doc;
          this.lastInResponse = response[response.length - 1].payload.doc;

          this.tableData = [];
          for (let item of response) {
            const itemData = item.payload.doc.data();
            itemData.id = item.payload.doc.id;
            this.tableData.push(itemData);
            console.log('table data', this.tableData);
            
            //this.tableData.push(item.payload.doc.data());
          }

          this.source = new LocalDataSource(this.tableData)
          //Initialize values
          this.prev_strt_at = [];
          this.pagination_clicked_count = 0;
          this.disable_next = false;
          this.disable_prev = false;

          //Push first item to use for Previous action
          this.push_prev_startAt(this.firstInResponse);
          }, error => {
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
    this.afs.collection('/accounts').doc(this.accountFirebase).collection('/variations', ref => ref
      .limit(10)
      .where("projectId", '==', this.passID.id)
      .orderBy("variantsNumber", 'desc')
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
        this.source = new LocalDataSource(this.tableData)
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
    this.afs.collection('/accounts').doc(this.accountFirebase).collection('/variations', ref => ref
      .where("projectId", '==', this.passID.id)
      .orderBy("variantsNumber", 'desc')
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
        this.source = new LocalDataSource(this.tableData)
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

  public reset(){
    this.listmode = 'default';
    this.filterVariationsForm.patchValue({
      status: '',
      dueDate: '',
    });
    this.getVariations();
  }
}
