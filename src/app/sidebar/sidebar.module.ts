import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {MatLegacyDialogModule as MatDialogModule} from '@angular/material/legacy-dialog';
import {MatLegacyInputModule as MatInputModule} from '@angular/material/legacy-input';
import {MatLegacyButtonModule as MatButtonModule} from '@angular/material/legacy-button';
import { MaterialFileInputModule } from 'ngx-material-file-input';

import { SidebarComponent,FeedbackDialog } from './sidebar.component';

@NgModule({
    imports: [
        RouterModule,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatInputModule,
        MatButtonModule,
        MaterialFileInputModule
    ],
    declarations: [SidebarComponent, FeedbackDialog],
    exports: [SidebarComponent]
})

export class SidebarModule {}
