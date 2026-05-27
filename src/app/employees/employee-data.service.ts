import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpParams }               from '@angular/common/http';
import { Observable }                           from 'rxjs';
import { tap }                                  from 'rxjs/operators';
import { Employee }                             from '../models/employee.model';
import { environment }                          from '../../environments/environment';

export interface EmployeeStats {
  total:    number;
  active:   number;
  onLeave:  number;
  inactive: number;
}

@Injectable({ providedIn: 'root' })
export class EmployeeDataService {

  private http    = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/employees`;

  // ── Private writable signals ─────────────────────────────────────────────
  private _employees = signal<Employee[]>([]);
  private _loading   = signal<boolean>(false);
  private _error     = signal<string | null>(null);
  private _stats     = signal<EmployeeStats>({ total: 0, active: 0, onLeave: 0, inactive: 0 });

  // ── Public read-only signals (components read, cannot write) ─────────────
  readonly employees = this._employees.asReadonly();
  readonly loading   = this._loading.asReadonly();
  readonly error     = this._error.asReadonly();
  readonly stats     = this._stats.asReadonly();

  // ── Computed signals ─────────────────────────────────────────────────────
  readonly totalCount   = computed(() => this._stats().total);
  readonly activeCount  = computed(() => this._stats().active);
  readonly onLeaveCount = computed(() => this._stats().onLeave);

  // ── LOAD ALL ─────────────────────────────────────────────────────────────
  loadEmployees(search?: string, status?: string, department?: string): void {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();
    if (search)     params = params.set('search',     search);
    if (status)     params = params.set('status',     status);
    if (department) params = params.set('department', department);

    this.http.get<Employee[]>(this.baseUrl, { params }).subscribe({
      next: (data) => {
        this._employees.set(data);
        this._loading.set(false);
      },
      error: (err) => {
        console.error('Load employees error:', err);
        this._error.set('Failed to load employees. Is the server running?');
        this._loading.set(false);
      }
    });
  }

  // ── LOAD STATS ───────────────────────────────────────────────────────────
  loadStats(): void {
    this.http.get<EmployeeStats>(`${this.baseUrl}/stats`).subscribe({
      next:  (data) => this._stats.set(data),
      error: (err)  => console.error('Load stats error:', err)
    });
  }

  // ── FIND ONE (local cache) ────────────────────────────────────────────────
  getById(id: number): Employee | undefined {
    return this._employees().find(e => e.id === id);
  }

  // ── FETCH ONE from API (used by View and Edit pages) ─────────────────────
  fetchById(id: number): Observable<Employee> {
    return this.http.get<Employee>(`${this.baseUrl}/${id}`);
  }

  // ── CREATE — returns Observable so the form can navigate on success ───────
  addEmployee(emp: Omit<Employee, 'id'>): Observable<Employee> {
    return this.http.post<Employee>(this.baseUrl, emp).pipe(
      tap(() => {
        this.loadStats();         // keep stat cards in sync
      })
    );
  }

  // ── UPDATE — returns Observable so the caller can react on success ────────
  updateEmployee(id: number, emp: Omit<Employee, 'id'>): Observable<Employee> {
    return this.http.put<Employee>(`${this.baseUrl}/${id}`, emp).pipe(
      tap(() => this.loadStats())
    );
  }

  // ── DELETE — fire-and-forget; updates local signal on success ────────────
  deleteEmployee(id: number): void {
    this.http.delete<void>(`${this.baseUrl}/${id}`).subscribe({
      next: () => {
        this._employees.update(list => list.filter(e => e.id !== id));
        this.loadStats();
      },
      error: (err) => {
        console.error('Delete error:', err);
        this._error.set('Failed to delete employee. Please try again.');
      }
    });
  }
}
