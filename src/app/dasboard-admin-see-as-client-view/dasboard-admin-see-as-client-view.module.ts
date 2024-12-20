import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DasboardAdminSeeAsClientViewRoutingModule } from './dasboard-admin-see-as-client-view-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Ng2SmartTableModule } from 'ng2-smart-table';


@NgModule({
  declarations: [
    DashboardComponent
  ],
  imports: [
    CommonModule,
    DasboardAdminSeeAsClientViewRoutingModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    Ng2SmartTableModule
  ]
})
export class DasboardAdminSeeAsClientViewModule { }
