import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router }             from '@angular/router';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators
} from '@angular/forms';
import { CommonModule }        from '@angular/common';
import { EmployeeDataService } from '../employee-data.service';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employee-form.component.html',
  styleUrl:    './employee-form.component.scss'
})
export class EmployeeFormComponent implements OnInit {

  // ── Services ─────────────────────────────────────────────────────────────
  private router     = inject(Router);
  private route      = inject(ActivatedRoute);
  private empService = inject(EmployeeDataService);

  // ── Mode ──────────────────────────────────────────────────────────────────
  isEditMode   = signal(false);
  employeeId   = signal<number | null>(null);
  isSaving     = signal(false);
  isLoadingEmp = signal(false);   // true while pre-filling the form in edit mode

  // ── Dropdown options (aligned with backend values) ────────────────────────
  readonly departments = [
    'Engineering', 'HR', 'Finance', 'Marketing', 'Operations',
    'Sales', 'Legal', 'Product', 'Design', 'Data Science', 'DevOps', 'Support'
  ];

  readonly designations = [
    'Developer', 'Sr. Developer', 'Tech Lead',
    'Manager', 'Sr. Manager', 'Director',
    'Analyst', 'Sr. Analyst',
    'Associate', 'Consultant', 'Architect'
  ];

  readonly statuses = ['Active', 'Inactive', 'On Leave'];

  // ── Form Definition ───────────────────────────────────────────────────────
  form = new FormGroup({
    firstName:   new FormControl('',   [Validators.required, Validators.minLength(2)]),
    lastName:    new FormControl('',   [Validators.required, Validators.minLength(2)]),
    email:       new FormControl('',   [Validators.required, Validators.email]),
    phone:       new FormControl('',   [Validators.pattern('^([0-9]{10})?$')]),
    department:  new FormControl('',   [Validators.required]),
    designation: new FormControl('',   [Validators.required]),
    salary:      new FormControl<number | null>(null, [Validators.required, Validators.min(1000)]),
    joinDate:    new FormControl('',   [Validators.required]),
    status:      new FormControl('Active', [Validators.required])
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode.set(true);
      this.employeeId.set(Number(idParam));
      this.loadEmployee(Number(idParam));
    }
  }

  private loadEmployee(id: number): void {
    this.isLoadingEmp.set(true);
    this.empService.fetchById(id).subscribe({
      next: (emp) => {
        this.form.patchValue({
          firstName:   emp.firstName,
          lastName:    emp.lastName,
          email:       emp.email,
          phone:       emp.phone   ?? '',
          department:  emp.department,
          designation: emp.designation,
          salary:      emp.salary,
          joinDate:    emp.joinDate,   // already "yyyy-MM-dd" from the API
          status:      emp.status
        });
        this.isLoadingEmp.set(false);
      },
      error: () => {
        this.isLoadingEmp.set(false);
        this.router.navigate(['/employees']);
      }
    });
  }

  // ── Validation helpers ────────────────────────────────────────────────────
  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  hasError(field: string, errorKey: string): boolean {
    const c = this.form.get(field);
    return !!(c?.hasError(errorKey) && c?.touched);
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  onSave(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.isSaving.set(true);
    const v = this.form.value;

    const payload = {
      firstName:   v.firstName!,
      lastName:    v.lastName!,
      email:       v.email!,
      phone:       v.phone ?? '',
      department:  v.department!,
      designation: v.designation!,
      salary:      v.salary!,
      joinDate:    v.joinDate!,
      status:      v.status as 'Active' | 'Inactive' | 'On Leave'
    };

    // Route to PUT (edit) or POST (create) depending on mode
    const request$ = this.isEditMode()
      ? this.empService.updateEmployee(this.employeeId()!, payload)
      : this.empService.addEmployee(payload);

    request$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.router.navigate(['/employees']);
      },
      error: (err) => {
        this.isSaving.set(false);
        console.error('Failed to save employee:', err);
      }
    });
  }

  // ── Cancel ────────────────────────────────────────────────────────────────
  onCancel(): void {
    this.router.navigate(['/employees']);
  }
}
