import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { NgxLoadingSpinnerService } from '@k-adam/ngx-loading-spinner';
import { LocalDataSource } from 'ng2-smart-table';
import { first } from 'rxjs/operators';
import { DatasourceService } from 'src/app/services/datasource.service';
import { PdfImage } from 'src/app/services/pdf-image';
import { PreviewImage } from 'src/app/services/preview-image';
import { RoleChecker } from 'src/app/services/role-checker.service';
import { AuthenticationService } from 'src/app/shared/authentication.service';
import { VariationsProjectRenderComponent } from 'src/app/variations/variationsproject/variationsproject-render.component';
import { RFIProjectRenderComponent } from './rfieditcomponent/rfiproject-render.component';

@Component({
  selector: 'app-rfiproject',
  templateUrl: './rfiproject.component.html',
  styleUrls: ['./rfiproject.component.css']
})
export class RFIPROJECTComponent {
   
  source: LocalDataSource = new LocalDataSource;
  public passID: any;
  
  public selected: any

  projectData;

  selectionForm: FormGroup;

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
            return this.passID.id;
          },
          renderComponent: RFIProjectRenderComponent
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
          title: 'RFI Number',
          sort: false,
          valuePrepareFunction: (cell,row) => {
            console.log('row',row);
            
              return row.rfiNumber;
          }
        },
        variation_name: {
          title: 'RFI Name',
          sort: false,
          valuePrepareFunction: (cell,row) => {
              return row.rfiName;
          }
        },
        // total: {
        //   title: 'Total',
        //   sort: false,
        //   valuePrepareFunction: (cell,row) => {
        //       return this.getTotal(row.rfiGroupArray);
        //   }
        // },
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

      console.log('/selections/project/'+this.passID.id+'/create', 'passID')
      

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
       this.getRFI();
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

  // public getRFI(){
  //   this.data_api.getFBVariations(this.passID.id).subscribe(data => {
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
      this.getRFIFilterStatus();
    }else if( this.filterVariationsForm.value.dueDate){
      this.listmode = 'filter-duedate';
      this.getRFIFilterDueDate();
    
    }
    
  }


  //Filter Status
  getRFIFilterStatus(){

        this.afs.collection('/accounts').doc(this.accountFirebase).collection('/rfis', ref => ref
        .where("projectId", '==', this.passID.id)
        .where("status", '==', this.filterVariationsForm.value.status)
        // .orderBy("variantsNumber", 'desc')
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
      this.afs.collection('/accounts').doc(this.accountFirebase).collection('/rfis', ref => ref
        .limit(10)
        .where("projectId", '==', this.passID.id)
        .where("status", '==', this.filterVariationsForm.value.status)
        .orderBy("rfiNumber", 'desc')
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
      this.afs.collection('/accounts').doc(this.accountFirebase).collection('/rfis', ref => ref
        .where("projectId", '==', this.passID.id)
        .where("status", '==', this.filterVariationsForm.value.status)
        // .orderBy("variantsNumber", 'desc')
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
  getRFIFilterDueDate(){

      var startDate = new Date(this.filterVariationsForm.value.dueDate) ;
      var endDate = new Date(this.filterVariationsForm.value.dueDate);
      endDate.setDate(startDate.getDate() + 1);
      this.afs.collection('/accounts').doc(this.accountFirebase).collection('/rfis', ref => ref
      .where("projectId", '==', this.passID.id)
      .where("dueDate", '>=', startDate)
      .where("dueDate", '<', endDate)
      // .orderBy("rfiNumber", 'desc')
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

  getRFI(){

    this.afs.collection('/accounts').doc(this.accountFirebase).collection('/rfis', ref => ref
    .where("projectId", '==', this.passID.id)
    .orderBy("rfiNumber", 'desc')
    .limit(10)
    ).snapshotChanges()
    .subscribe(response => {
      console.log('response', response);
      
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
          console.log('this.tableData', this.tableData);
          
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
          console.log('errror', error);
          
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
  this.afs.collection('/accounts').doc(this.accountFirebase).collection('/rfis', ref => ref
    .limit(10)
    .where("projectId", '==', this.passID.id)
    .orderBy("rfiNumber", 'desc')
    .startAfter(this.lastInResponse)
  ).get()
    .subscribe(response => {
     console.log('response',response);
     
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
  this.afs.collection('/accounts').doc(this.accountFirebase).collection('/rfis', ref => ref
    .where("projectId", '==', this.passID.id)
    .orderBy("rfiNumber", 'desc')
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
  this.getRFI();
}
}
