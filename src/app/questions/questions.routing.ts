import { Routes } from '@angular/router';

import { QuestionsComponent } from './questions.component';

export const QuestionsRoutes: Routes = [
    {
        path: '',
        children: [ {
            path: '',
            component: QuestionsComponent
            }
        ]
    }
];
