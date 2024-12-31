import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { LocalDataSource } from 'ng2-smart-table';
import { DatasourceService } from 'src/app/services/datasource.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  filter_list_clients :any
  selectedClientId:any
  selectedClientName:any
  source: LocalDataSource = new LocalDataSource;
  currentProject : string

  constructor(private afs: AngularFirestore, private datasourceService: DatasourceService, private sanitizer: DomSanitizer){}

  ngOnInit(){
   this.currentProject = this.datasourceService.getCurrentProject();
   this.getClient()
  }

 getClient() {
    this.afs.collection('/users', ref => ref.where('userRole', '==', 'project_owner'))
      .get()
      .subscribe(snapshot => {
        // Clear the filter_list_clients array before populating it with new data
        this.filter_list_clients = []; 
        
        snapshot.docs.forEach(doc => {
          // Push the required data from each document into the filter_list_clients array
          // You can choose to store specific fields, for example, the user's name or email
          // Assuming you want to store the names of the users:
          const userData :any = doc.data();
          console.log('userData',userData)
          if (userData.userAccounts.includes(this.currentProject)) {
            this.filter_list_clients.push({
              userData  
              // id: userData.id, 
              // name: userData.userFirstName + " " + userData.userLastName
            });
          }
          // this.source = new LocalDataSource(this.filter_list_clients)
          this.source.load(this.filter_list_clients)
          console.log('this.source', this.source)
        });

        // Log the updated array
        console.log(this.filter_list_clients);
      });
  }

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
          const link = `<a href="#/client-view/${row.userData.id}">
                  <i class="material-icons">preview</i>
                </a>`;
        return this.sanitizer.bypassSecurityTrustHtml(link);
        }
      },
      client_name: {
        title: 'Client Name',
        width: '150px',
        filter: false,
        sort: false,
        valuePrepareFunction: (cell,row) => {
            return row.userData.userFirstName + " " + row.userData.userLastName;
        }
      },
      // Client_Id: {
      //   title: 'Client Id ',
      //   width: '100px',
      //   filter: false,
      //   sort: false,
      //   valuePrepareFunction: (cell,row) => {
      //     console.log('check row id', row)
      //     return row.userData.id;
      //   }
      // },
     
      userEmail: {
        title: 'userEmail',
        filter: false,
        sort: false,
        valuePrepareFunction: (cell,row) => {
          return row.userData.userEmail
        }
      },
      userAccounts: {
        title: 'userAccounts',
        filter: false,
        sort: false,
        valuePrepareFunction: (cell,row) => {
          return row.userData.userAccounts;
        }
      },
      userRole: {
        title: 'userRole',
        width: '150px',
        sort: false,
        valuePrepareFunction: (cell,row) => {
            return row.userData.userRole;
        }
      }
    }
  };

  showClientDataById() {
    if (!this.selectedClientId) {
      console.log('No client selected');
      return;
    }

    const getClientById = this.afs.collection('/accounts')
      .doc('diarystaging')
      .collection('/variations', ref => 
        ref.where("projectOwner", 'array-contains', this.selectedClientId)
      );

    getClientById.get().subscribe(snapshot => {
      if (snapshot.empty) {
        console.log('No matching client data found.');
      } else {
        const clientData = []; // Initialize an empty array to store the client data

        snapshot.docs.forEach(doc => {
          const data = doc.data();
          console.log('Client Data:', data);
          clientData.push(data);  // Push the data into the array
        });

        // After collecting all the data, bind it to the LocalDataSource
        this.source.load(clientData); // Load the data into the LocalDataSource
        console.log('Data loaded into LocalDataSource:', this.source);
      }
    });
  }


  public Settings = {
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
      // customactions: {
      //   width: '30px',
      //   title: '',
      //   type : 'html',
      //   filter: false,
      //   sort: false,
      //   valuePrepareFunction: (cell,row) => {
      //     console.log('row',row);
          
      //     return `<a target="_blank" href="#/dashboard-variants/${row.id}"><i class="material-icons">preview</i></a>
      //             `;
      //   } 
      // },
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
      // project_name: {
      //   title: 'Project Name',
      //   filter: false,
      //   sort: false,
      //   valuePrepareFunction: (cell,row) => {
      //     return this.projectNames.find(o => o.id === row.projectId)?.projectName;
      //   }
      // },
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
}
