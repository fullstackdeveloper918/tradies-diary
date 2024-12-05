import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, Inject, HostListener} from '@angular/core';
import {DateAdapter, MAT_DATE_FORMATS} from '@angular/material/core';
import { AppDateAdapter, APP_DATE_FORMATS } from '../services/format-datepicker';
import { DatasourceService } from '../services/datasource.service';
import { PdfImage } from '../services/pdf-image';
import { PreviewImage } from '../services/preview-image';
import { Observable, Observer } from 'rxjs';
import { Input } from '@angular/core';
//import * as $$ from 'jQuery';
import { NgxLoadingSpinnerService } from '@k-adam/ngx-loading-spinner';
import { AuthenticationService } from '../shared/authentication.service';
import {FormBuilder, FormGroup, Validators, FormArray, FormControl, NgModel} from "@angular/forms";
import { DatePipe  } from '@angular/common';
import {ActivatedRoute, Params, Router} from '@angular/router';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs;
import {ENTER, COMMA} from '@angular/cdk/keycodes';
import { ImageCompressorService, CompressorConfig } from 'ngx-image-compressor';
import imageCompression from 'browser-image-compression'
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import * as moment from 'moment';
import { ReplaySubject, Subject } from 'rxjs';
import { take, takeUntil, startWith } from 'rxjs/operators';
import { MatSelect } from '@angular/material/select';
import {MyService} from '../services/image-upload-service'; 
import { CdkDragDrop, moveItemInArray, transferArrayItem, CdkDragEnter } from "@angular/cdk/drag-drop";
import { AngularFireStorage, AngularFireStorageReference, AngularFireUploadTask } from '@angular/fire/compat/storage';
import {  first, reduce, map, finalize  } from 'rxjs/operators';
import { NgxProgressOverlayService } from 'ngx-progress-overlay';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { DeviceDetectorService } from 'ngx-device-detector';

declare const $: any;

@Component({
  selector: 'app-selections',
  templateUrl: './selections.component.html',
  providers: [
    {provide: DateAdapter, useClass: AppDateAdapter},
    {provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS},
    DatePipe
  ]
})
export class SelectionsComponent implements OnInit {

  public projectNames:any = [];
  editForm: FormGroup;

  public filter_list_projects: ReplaySubject<[]> = new ReplaySubject<[]>(1);
  public search_control_project: FormControl = new FormControl();

  protected _onDestroy = new Subject<void>();
    
    constructor(
        private data_api: DatasourceService,
        private spinnerService: NgxLoadingSpinnerService,
        public authService: AuthenticationService,
        private formBuilder: FormBuilder,
        public pdfImage: PdfImage,
        private previewImage: PreviewImage,
        public datepipe: DatePipe,
        private router: Router,
        private imageCompressor: ImageCompressorService,
        public dialog: MatDialog,
        private myService: MyService,
        private route: ActivatedRoute,
        private afStorage: AngularFireStorage,
        private progressOverlay: NgxProgressOverlayService,
        private afs: AngularFirestore,
        private deviceService: DeviceDetectorService
        ) { }
    
        public ngOnInit() {
        
          this.editForm = this.formBuilder.group({
            projectId: ['', Validators.required],
          });
  
          let currentUser = JSON.parse((localStorage.getItem('currentUser')));
  
          if(currentUser.userRole=='app_admin'){
              this.getFBProjects();
          }else if(currentUser.userRole=='project_supervisor'){
              this.getSupervisorProjects(currentUser.user_id);
          }
  
        }

        getFBProjects() {
     
          this.data_api.getFBProjectsSelection().subscribe(response => {
           
            let data = [];
            for (let item of response.docs) {
                const itemData = item.data();
                itemData.id = item.id;
                data.push(itemData);
            }
            this.projectNames = [];
              if(data){
                data.forEach(data2 =>{ 
                  this.projectNames.push(data2)
                })
                
              }
              this.initializeFilterProjects();
          });
          
    
        }

        public getSupervisorProjects(curUserID){
  
          this.data_api.getFBProjectsSupervisor(curUserID).subscribe((data) => {
      
              data.forEach(data =>{ 
                if (!this.projectNames.find(item => item.id === data.id)) {
                  this.projectNames.push(data)
                }
              })
      
              this.getAltSupervisorProjects(curUserID);
          }
            )
        }

        public getAltSupervisorProjects(curUserID){
  
          this.data_api.getFBProjectsAltSupervisor(curUserID).subscribe((data) => {
      
              data.forEach(data =>{ 
                if (!this.projectNames.find(item => item.id === data.id)) {
                  this.projectNames.push(data)
                }
              })
      
              this.initializeFilterProjects();
          }
            )
        }

        initializeFilterProjects() {
          console.log('runing initialize')
  
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

      public projectSelect(){ 
        console.log(this.editForm.value.projectId, 'check route')
      this.router.navigate(['/selections/project/'+this.editForm.value.projectId]);
      }
}