import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router }             from '@angular/router';
import { CommonModule }                       from '@angular/common';
import { EmployeeDataService }                from '../employee-data.service';
import { Employee }                           from '../../models/employee.model';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employee-detail.component.html',
  styleUrl:    './employee-detail.component.scss'
})
export class EmployeeDetailComponent implements OnInit {

  private route      = inject(ActivatedRoute);
  private router     = inject(Router);
  private empService = inject(EmployeeDataService);

  employee = signal<Employee | null>(null);
  loading  = signal(true);
  error    = signal<string | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.empService.fetchById(id).subscribe({
      next:  emp  => { this.employee.set(emp); this.loading.set(false); },
      error: _err => { this.error.set('Employee not found.'); this.loading.set(false); }
    });
  }

  onEdit(): void {
    this.router.navigate(['/employees', this.employee()!.id, 'edit']);
  }

  onDelete(): void {
    const emp = this.employee();
    if (!emp) return;
    if (confirm(`Delete ${emp.firstName} ${emp.lastName}? This cannot be undone.`)) {
      this.empService.deleteEmployee(emp.id);
      this.router.navigate(['/employees']);
    }
  }

  onBack(): void {
    this.router.navigate(['/employees']);
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      'Active':   'status-active',
      'Inactive': 'status-inactive',
      'On Leave': 'status-leave'
    };
    return map[status] ?? '';
  }

  initials(emp: Employee): string {
    return `${emp.firstName[0]}${emp.lastName[0]}`.toUpperCase();
  }
}
