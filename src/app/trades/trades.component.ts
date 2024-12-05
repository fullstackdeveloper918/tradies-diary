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
import {TradesRenderComponent} from './tradesbutton-render.component';
import { ExportToCsv } from 'export-to-csv';
import { NgxCsvParser } from 'ngx-csv-parser';
import { NgxCSVParserError } from 'ngx-csv-parser';
import { RoleChecker } from '../services/role-checker.service';

declare const $: any;

@Component({
  selector: 'app-trade',
  templateUrl: './trades.component.html',
})
export class TradesComponent implements OnInit {

  source: LocalDataSource = new LocalDataSource;
  public projectList;

  public listTrades;

  csvRecords: any[] = [];
  header = true;

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
        renderComponent: TradesRenderComponent
      },
    //   customactions: {
    //     title: 'Action',
    //     width: '100px',
    //     type : 'custom',
    //     filter: false,
    //     valuePrepareFunction: (cell,row) => {
    //       <a [routerLink]="" (click)="openDialog()"><i class="material-icons">edit</i></a>
    // <a [routerLink]="" (click)="openDeleteDialog()"><i class="material-icons">delete</i></a>
    //       return `<a href="#/projects/edit/${row.id}"><i class="material-icons">edit</i></a>`;
    //     }
    //   },
      company_name: {
        title: 'Company Name',
        sort: false,
        valuePrepareFunction: (cell,row) => {
            return row.tradeCompanyName;
        }
      },
      trade: {
        title: 'Trade',
        sort: false,
        valuePrepareFunction: (cell,row) => {
            return row.trade;
        }
      },
      name: {
        title: 'Name',
        sort: false,
        valuePrepareFunction: (cell,row) => {
            return row.tradeName;
        }
      },
      email: {
        title: 'Email',
        sort: false,
        valuePrepareFunction: (cell,row) => {
            return row.tradeEmail;
        }
      },
      phone: {
        title: 'Phone',
        sort: false,
        valuePrepareFunction: (cell,row) => {
            return row.tradePhone;
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

  adminData;

  colorBtnDefault;

  constructor(
    private data_api: DatasourceService,
    private formBuilder: FormBuilder,
    private spinnerService: NgxLoadingSpinnerService,
    public dialog: MatDialog,
    private ngxCsvParser: NgxCsvParser,
    private rolechecker: RoleChecker
    ) { }

  @ViewChild('fileImportInput', { static: false }) fileImportInput: any;

  public ngOnInit() {
    this.getAdminSettings();
    // this.rolechecker.check(4)
    this.getFBAllTrades();
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

  getFBAllTrades(): void {
    this.spinnerService.show();
    this.data_api.getFBAllTrades().subscribe(data => {
      console.log(data);

        if(data){

          data.sort(function(a, b) {
              var textA = a.tradeCompanyName.toUpperCase();
              var textB = b.tradeCompanyName.toUpperCase();
              return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
          });

          this.source = new LocalDataSource(data)
          this.spinnerService.hide();
          this.listTrades = data;
        }

    });
  }

  // public getTrades(){
  //       this.spinnerService.show();

  //       this.data_api.getTrades().subscribe((data) => {
  //           this.source.load(data);
  //           // this.projectList = data[0];
  //           this.spinnerService.hide();
  //           console.log(data);
  //           this.listTrades = data;
  //       });
  // }

    // Your applications input change listener for the CSV File
  fileChangeListener($event: any): void {
    this.spinnerService.show();
      // Select the files from the event
      const files = $event.srcElement.files;
  
      // Parse the file you want to select for the operation along with the configuration
      this.ngxCsvParser.parse(files[0], { header: this.header, delimiter: ',' })
        .pipe().subscribe((result: Array<any>) => {
  

          console.log(result);
          this.csvRecords = result;

          // let sample = [];
          // sample = result.reduce(function (r, a) {
          //       r[a.company_name] = r[a.company_name] || [];
          //       r[a.company_name].push(a);
          //       return r;
          //   }, Object.create(null));

          // console.log(sample);

          // sample.forEach(data2 =>{
          //     console.log(data2)
          // });



        // function groupBy(objectArray, property) {
        //     return objectArray.reduce((acc, obj) => {
        //        const key = obj[property];
        //        if (!acc[key]) {
        //           acc[key] = [];
        //        }
        //        // Add object to list for given key's value
        //        acc[key].push(obj);
        //        return acc;
        //     }, {});
        //  }
        //  let groupedPeople = groupBy(result, 'company_name');
        //  console.log(groupedPeople);

        //  for (let i = 0; i < groupedPeople.length; i++) {
        //     console.log ("Block statement execution no." + i);
        //   }


          // let sample = [];

          // result.forEach(data2 =>{

          //       console.log(data2);

          //       if(data2.company_name){



          //       }

          //       // let tempData = {
          //       //   staffID: data2.staffID,
          //       //   staffName: data2.staffName,
          //       //   start: data2.start,
          //       //   break: data2.break,
          //       //   finish: data2.finish,
          //       // }

          //       // sample.push(tempData);


          // });

          var groupByName = [];
          function convertByProperty(originalObject, groupByProperty) {
              var finalArray = [];
              var uniqueVals = [];
              originalObject.map((i) => {
                  var existingVals = uniqueVals.filter((j) => { return (i[groupByProperty] == j) });
                  if (existingVals.length == 0) {
                      uniqueVals.push(i[groupByProperty]);
                  }
              });
              console.log(uniqueVals);
              uniqueVals.map((k) => {
                  var dataObj = [];
                  var expectedObj = {};
                  var items = originalObject.filter((l) => { return (l[groupByProperty] == k) });
                  items.map((m) => {
                      console.log(m);
                      var obj = {};
                      // obj[secondProperty] = m[secondProperty];
                      // obj['staffID'] = m.staffID;
                      obj['staffID'] = Math.random().toString(36).substr(2, 9);
                      obj['staffName'] = m.staffName;
                      obj['start'] = m.start;
                      obj['break'] = m.break;
                      obj['finish'] = m.finish;
                      dataObj.push(obj);
                  });
                  expectedObj[groupByProperty] = k;
                  expectedObj['trade'] = items[0].trade;
                  expectedObj['name'] = items[0].name;
                  expectedObj['email'] = items[0].email;
                  expectedObj['phone'] = items[0].phone;
                  expectedObj['default_costcode'] = items[0].default_costcode;
                  expectedObj['trade_staff'] = JSON.stringify(dataObj);
                  finalArray.push(expectedObj);
              });
          
              return finalArray;
          }

          groupByName = convertByProperty(result, 'company_name');

          console.log(groupByName);
  
          this.data_api.importTrades(groupByName)
          .subscribe(
            (result2) => {
                swal.fire({
                      title: "New Trade Imported!",
                      // text: "You clicked the button!",
                      buttonsStyling: false,
                      customClass: {
                        confirmButton: 'btn btn-success',
                      },
                      icon: "success"
                  })

                  this.spinnerService.hide();
                  setTimeout(function(){
                    window.location.reload();
                  }, 1000);  

            },
            (error) => {
                console.log(error)
                // console.log(error.error.error.message)
                swal.fire({
                    title: 'Import Failed. Please check the data format.',
                    // text: error.text,
                    buttonsStyling: false,
                    customClass: {
                      confirmButton: 'btn btn-success',
                    },
                    icon: "error"
                })
                
            }
            
          );  


        }, (error: NgxCSVParserError) => {
          console.log('Error', error);
        });
  
    }

  downloadCSV(){
        let exportData=[];

        if(this.listTrades){

            this.listTrades.forEach(data =>{

                // let tempData = {
                //   company_name: data.company_name,
                //   trade: data.trade,
                //   name: data.name,
                //   email: data.email,
                //   phone: data.phone,
                //   trade_staff: data.trade_staff,
                //   default_costcode: data.default_costcode
                // }
                let staffList = [];
                if(data.trade_staff){
                    staffList = JSON.parse(data.trade_staff);
                }
                console.log(staffList[0].staffID);

                let tempData = {
                  company_name: data.company_name,
                  trade: data.trade,
                  name: data.name,
                  email: data.email,
                  phone: ' '+data.phone,
                  default_costcode: data.default_costcode,
                  // staffID: staffList[0].staffID,
                  staffName: staffList[0].staffName,
                  start: ' '+staffList[0].start,
                  break: ' '+staffList[0].break,
                  finish: ' '+staffList[0].finish,
                }

                exportData.push(tempData);
                
                // trade_staff: data.trade_staff,
                  let i = 0;
                  staffList.forEach(data2 =>{

                      if(i > 0){

                          let tempData2 = {
                              company_name: data.company_name,
                              trade: '',
                              name: '',
                              email: '',
                              phone: '',
                              default_costcode: '',
                              // staffID: data2.staffID,
                              staffName: data2.staffName,
                              start: ' '+data2.start,
                              break: ' '+data2.break,
                              finish: ' '+data2.finish,
                          }

                          exportData.push(tempData2);

                      }

                      i++
                  });


               
                // data.forEach(data2 =>{      
                //   if(data == data2.id){
                //     this.listVisitors.push({visitor_name: data2.name})  
                //   }
                // });

            });

        }

          const options = { 
            fieldSeparator: ',',
            quoteStrings: '"',
            decimalSeparator: '.',
            showLabels: true, 
            showTitle: false,
            // title: 'My Awesome CSV',
            useTextFile: false,
            useBom: true,
            useKeysAsHeaders: true,
            filename:'trades'
            // headers: ['Column 1', 'Column 2', etc...] <-- Won't work with useKeysAsHeaders present!
          };
        
        const csvExporter = new ExportToCsv(options);
        
        csvExporter.generateCsv(exportData);
     
  }

}

