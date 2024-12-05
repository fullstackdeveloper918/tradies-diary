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
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import swal from 'sweetalert2';
import {WorkerLogsRenderComponent} from './workerlogsbutton-render.component';
import {WorkerLogsImageRenderComponent} from './workerlogsimagebutton-render.component';
import { ExportToCsv } from 'export-to-csv';
import { NgxCsvParser } from 'ngx-csv-parser';
import { NgxCSVParserError } from 'ngx-csv-parser';
import { RoleChecker } from '../services/role-checker.service';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';

declare const $: any;

@Component({
  selector: 'app-workerlogs',
  templateUrl: './workerlogs.component.html',
})

export class WorkerLogsComponent implements OnInit {

    source: LocalDataSource = new LocalDataSource;

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
    
    accountFirebase;

    public userDetails;

    public projectNames = [];

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
            title: 'Action',
            width: '100px',
            type : 'custom',
            filter: false,
            sort: false,
            valuePrepareFunction: (cell, row) => row,
            renderComponent: WorkerLogsRenderComponent
          //   return `<a href="#/search/edit/${row.id}"><i class="material-icons">edit</i></a>`;
            // }
          },
          project_name: {
            width: '300px',
            title: 'Project Name',
            valuePrepareFunction: (cell,row) => {
                return this.projectNames.find(o => o.id === row.projectId).projectName;
            }
          },
          date: {
            title: 'Date',
            width: '200px',
            valuePrepareFunction: (cell,row) => {
              return row.selectedDate.toDate().toDateString();
            }
          },
          notes: {
            title: 'Notes',
            valuePrepareFunction: (cell,row) => {
                return row.accomplishments;
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
          entry_status: {
            title: 'Status',
            width: '10%',
            valuePrepareFunction: (cell,row) => {
                return row.entryStatus + ' ' + (row.modifiedBy ? "(modified by "+row.modifiedBy+")" : "") + ' ' + (row.modifiedDate ? "(updated last "+row.modifiedDate.toDate().toDateString()+")" : "");
            }
          },
          image: {
            title: 'Image',
            type : 'custom',
            width: '200px',
            valuePrepareFunction: (cell,row)  => row,
                renderComponent: WorkerLogsImageRenderComponent,
                onComponentInitFunction :(instance) => {
                    instance.save.subscribe(row => {
                      console.log(row);
                    });
                }
          },
        }
      };

      
    constructor(
        private data_api: DatasourceService,
        private formBuilder: FormBuilder,
        private spinnerService: NgxLoadingSpinnerService,
        public dialog: MatDialog,
        private ngxCsvParser: NgxCsvParser,
        private rolechecker: RoleChecker,
        private afs: AngularFirestore
        ) { }
    
      public ngOnInit() {

        if (localStorage.getItem('currentUser')) {
            this.userDetails = JSON.parse(localStorage.getItem('currentUser'));
        }

        this.accountFirebase = this.data_api.getCurrentProject();

        this.getFBProjects();
        this.getFBWorkerLogs();
      }


      getFBProjects(): void {
          this.data_api.getFBProjects().subscribe(data => {
            console.log(data);

            data.forEach(data =>{ 
                this.projectNames.push(data)
            })

          });
      }

      getFBWorkerLogs(){

        this.afs.collection('/accounts').doc(this.accountFirebase).collection('/timesheet', ref => ref
        .where("workerID", '==', this.userDetails.user_id)
        .orderBy('selectedDate', 'desc')
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
            }
  
            this.source = new LocalDataSource(this.tableData)
            console.log(this.source);
            //Initialize values
            this.prev_strt_at = [];
            this.pagination_clicked_count = 0;
            this.disable_next = false;
            this.disable_prev = false;
  
            //Push first item to use for Previous action
            this.push_prev_startAt(this.firstInResponse);
            }, error => {
                console.log(error);
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
          this.afs.collection('/accounts').doc(this.accountFirebase).collection('/timesheet', ref => ref
            .where("workerID", '==', this.userDetails.user_id)
            .limit(10)
            .orderBy('selectedDate', 'desc')
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
              }
              this.source = new LocalDataSource(this.tableData)
      
              console.log(this.source);
      
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
          this.afs.collection('/accounts').doc(this.accountFirebase).collection('/timesheet', ref => ref
            .where("workerID", '==', this.userDetails.user_id)
            .orderBy('selectedDate', 'desc')
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
        
}