import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { ServiceOrderUtilityRow } from '../../../core/models/service-order.model';
import { SPServiceOrder } from '../../../core/services/supabase/sb-service-order';

@Component({
  selector: 'app-utility-report-dashboard',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    DecimalPipe,
    DatePipe,
  ],
  templateUrl: './utility-report-dashboard.html',
  styleUrl: './utility-report-dashboard.scss',
})
export class UtilityReportDashboard implements OnInit {
  private serviceOrderProvider = inject(SPServiceOrder);
  private snackBar = inject(MatSnackBar);

  readonly rows = signal<ServiceOrderUtilityRow[]>([]);
  readonly loading = signal(false);

  readonly columns = ['started_date', 'number', 'customer', 'vehicle', 'income', 'cost', 'utility'];

  readonly filterForm = new FormGroup({
    from: new FormControl<Date | null>(null),
    to: new FormControl<Date | null>(null),
  });

  readonly totalIncome = computed(() => this.rows().reduce((acc, r) => acc + r.income, 0));
  readonly totalCost = computed(() => this.rows().reduce((acc, r) => acc + r.cost, 0));
  readonly totalUtility = computed(() => this.rows().reduce((acc, r) => acc + r.utility, 0));

  ngOnInit(): void {
    this.search();
  }

  search(): void {
    const raw = this.filterForm.value;
    this.loading.set(true);
    this.serviceOrderProvider
      .getUtilityReport({
        from: raw.from ? this.toIsoDate(raw.from) : undefined,
        to: raw.to ? this.toIsoDate(raw.to) : undefined,
      })
      .subscribe({
        next: (data) => {
          this.rows.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.snackBar.open('Error al cargar el reporte', 'Cerrar', { duration: 4000 });
        },
      });
  }

  onClearFilters(): void {
    this.filterForm.reset({ from: null, to: null });
    this.search();
  }

  vehicleLabel(row: ServiceOrderUtilityRow): string {
    if (!row.vehicle) return '—';
    return [row.vehicle.brand, row.vehicle.model, row.vehicle.license_plate].filter(Boolean).join(' ');
  }

  customerLabel(row: ServiceOrderUtilityRow): string {
    if (!row.customer) return '—';
    return [row.customer.name, row.customer.lastname].filter(Boolean).join(' ');
  }

  private toIsoDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
