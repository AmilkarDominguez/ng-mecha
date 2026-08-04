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
import { MatTabsModule } from '@angular/material/tabs';
import { ProductSalesReportRow, ServiceOrderUtilityRow } from '../../../core/models/service-order.model';
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
    MatTabsModule,
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
  // "Por Producto" (reports.md C.2) — recorte de este mismo reporte
  // acotado a repuestos, agrupado por producto. Comparte filtro de
  // fechas y boton Buscar con la pestaña "Por Orden"; no tiene ruta ni
  // menu propios a proposito (ver reports.md C.2).
  readonly productRows = signal<ProductSalesReportRow[]>([]);
  readonly loading = signal(false);

  readonly columns = ['started_date', 'number', 'customer', 'vehicle', 'income', 'cost', 'utility'];
  readonly productColumns = ['product_name', 'quantity', 'income', 'cost', 'utility'];

  readonly filterForm = new FormGroup({
    from: new FormControl<Date | null>(null),
    to: new FormControl<Date | null>(null),
  });

  readonly totalIncome = computed(() => this.rows().reduce((acc, r) => acc + r.income, 0));
  readonly totalCost = computed(() => this.rows().reduce((acc, r) => acc + r.cost, 0));
  readonly totalUtility = computed(() => this.rows().reduce((acc, r) => acc + r.utility, 0));

  readonly productTotalIncome = computed(() => this.productRows().reduce((acc, r) => acc + r.income, 0));
  readonly productTotalCost = computed(() => this.productRows().reduce((acc, r) => acc + r.cost, 0));
  readonly productTotalUtility = computed(() => this.productRows().reduce((acc, r) => acc + r.utility, 0));

  ngOnInit(): void {
    this.search();
  }

  search(): void {
    const raw = this.filterForm.value;
    const filters = {
      from: raw.from ? this.toIsoDate(raw.from) : undefined,
      to: raw.to ? this.toIsoDate(raw.to) : undefined,
    };

    this.loading.set(true);
    this.serviceOrderProvider.getUtilityReport(filters).subscribe({
      next: (data) => {
        this.rows.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Error al cargar el reporte', 'Cerrar', { duration: 4000 });
      },
    });

    this.serviceOrderProvider.getProductSalesReport(filters).subscribe({
      next: (data) => this.productRows.set(data),
      error: () => {
        this.snackBar.open('Error al cargar el desglose por producto', 'Cerrar', { duration: 4000 });
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
