import { Routes } from '@angular/router';

import { ArchiveComponent } from './archive.component';

export const ArchiveRoutes: Routes = [
    {

      path: '',
      children: [ {
        path: '',
        component: ArchiveComponent
    }]
}
];
