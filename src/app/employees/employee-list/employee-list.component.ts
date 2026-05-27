import { RouterLink } from '@angular/router'
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { EmployeeDataService } from '../employee-data.service';
import { Employee } from '../../models/employee.model';


@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, NgClass, RouterLink],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.scss'
})
export class EmployeeListComponent implements OnInit {

  // ── STEP 1: Inject the service ──────────────────
  // Angular DI gives us the single shared instance
  // Same instance used across all components
  empService = inject(EmployeeDataService);

  // ── STEP 2: Local signals (this screen only) ────
  searchTerm     = signal('');
  selectedStatus = signal('All');
  currentPage    = signal(1);
  readonly pageSize = 10;

  // ── STEP 3: Computed signals ────────────────────
  // These re-run automatically when any signal they
  // read changes. No manual refresh ever needed.

  filteredEmployees = computed(() => {
    let list = this.empService.employees(); // read shared signal

    // Apply search filter
    const term = this.searchTerm().toLowerCase();
    if (term) {
      list = list.filter(e =>
        e.firstName.toLowerCase().includes(term) ||
        e.lastName.toLowerCase().includes(term)  ||
        e.department.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    const status = this.selectedStatus();
    if (status !== 'All') {
      list = list.filter(e => e.status === status);
    }

    return list;
  });

  // Slice the filtered list for current page
  paginatedEmployees = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    const end   = start + this.pageSize;
    return this.filteredEmployees().slice(start, end);
  });

  // Total pages needed for pagination controls
  totalPages = computed(() =>
    Math.max(1, Math.ceil(
      this.filteredEmployees().length / this.pageSize
    ))
  );

  // Windowed page slots — at most 7 items wide.
  // null entries render as "…" ellipsis separators.
  // Example: [1, null, 48, 49, 50, null, 2000]
  visiblePages = computed((): (number | null)[] => {
    const total   = this.totalPages();
    const current = this.currentPage();
    const delta   = 2; // pages shown each side of current

    // No need for ellipsis when the total is small
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: (number | null)[] = [1];

    const left  = Math.max(2, current - delta);
    const right = Math.min(total - 1, current + delta);

    if (left > 2)        pages.push(null);          // left ellipsis
    for (let p = left; p <= right; p++) pages.push(p);
    if (right < total - 1) pages.push(null);        // right ellipsis

    pages.push(total);
    return pages;
  });

  // Showing X-Y of Z label
  showingFrom = computed(() =>
    this.filteredEmployees().length === 0
      ? 0
      : (this.currentPage() - 1) * this.pageSize + 1
  );

  showingTo = computed(() =>
    Math.min(
      this.currentPage() * this.pageSize,
      this.filteredEmployees().length
    )
  );

  // ── STEP 4: Lifecycle ───────────────────────────
  ngOnInit(): void {
    // Load employees and stats when component mounts
    this.empService.loadEmployees();
    this.empService.loadStats();
  }

  // ── STEP 5: User action handlers ────────────────
  // These are called from the template on user events

  onSearch(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    this.searchTerm.set(term);
    this.currentPage.set(1); // always reset to page 1 on new search
  }

  onStatusFilter(status: string): void {
    this.selectedStatus.set(status);
    this.currentPage.set(1); // reset to page 1 on filter change
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  onDelete(emp: Employee): void {
    const fullName = `${emp.firstName} ${emp.lastName}`;
    if (confirm(`Delete ${fullName}? This cannot be undone.`)) {
      this.empService.deleteEmployee(emp.id);
    }
  }

  // ── STEP 6: Helper methods ───────────────────────
  // Pure functions — no side effects, just return values

  initials(emp: Employee): string {
    return `${emp.firstName[0]}${emp.lastName[0]}`.toUpperCase();
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      'Active':   'status-active',
      'Inactive': 'status-inactive',
      'On Leave': 'status-leave'
    };
    return map[status] ?? '';
  }

  readonly statuses = ['All', 'Active', 'On Leave', 'Inactive'];
}