import { Routes } from '@angular/router';
import { EmployeeListComponent }   from './employees/employee-list/employee-list.component';
import { EmployeeFormComponent }   from './employees/employee-form/employee-form.component';
import { EmployeeDetailComponent } from './employees/employee-detail/employee-detail.component';

export const routes: Routes = [
  { path: '',                   redirectTo: 'employees', pathMatch: 'full' },
  { path: 'employees',          component: EmployeeListComponent   },
  // 'new' must be declared before ':id' so it is not swallowed by the param route
  { path: 'employees/new',      component: EmployeeFormComponent   },
  { path: 'employees/:id',      component: EmployeeDetailComponent },
  { path: 'employees/:id/edit', component: EmployeeFormComponent   },
  { path: '**',                 redirectTo: 'employees'            }
];
