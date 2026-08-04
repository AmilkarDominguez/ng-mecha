import { Component, computed, inject, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SPCustomer } from '../../../core/services/supabase/sb-customer';
import { SPMechanic } from '../../../core/services/supabase/sb-mechanic';

type BirthdayEntityType = 'CUSTOMER' | 'MECHANIC';

interface BirthdayRow {
  type: BirthdayEntityType;
  id: string;
  name: string | null;
  lastname: string | null;
  phone: string | null;
  birthdate: string;
  day: number;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

@Component({
  selector: 'app-birthday-report-dashboard',
  imports: [
    TitleCasePipe,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './birthday-report-dashboard.html',
  styleUrl: './birthday-report-dashboard.scss',
})
export class BirthdayReportDashboard {
  private customerService = inject(SPCustomer);
  private mechanicService = inject(SPMechanic);

  private readonly customers = toSignal(this.customerService.listen(), { initialValue: [] });
  private readonly mechanics = toSignal(this.mechanicService.listen(), { initialValue: [] });

  readonly columns = ['day', 'type', 'name', 'phone'];
  readonly monthOptions = MONTH_NAMES.map((label, i) => ({ value: i + 1, label }));

  private readonly currentMonth = new Date().getMonth() + 1;

  readonly filterForm = new FormGroup({
    month: new FormControl<number>(this.currentMonth, { nonNullable: true }),
  });

  readonly appliedMonth = signal(this.currentMonth);

  readonly rows = computed<BirthdayRow[]>(() => {
    const month = this.appliedMonth();

    const customerRows: BirthdayRow[] = this.customers()
      .filter((c) => c.birthdate && this.monthOf(c.birthdate) === month)
      .map((c) => ({
        type: 'CUSTOMER',
        id: c.id,
        name: c.name,
        lastname: c.lastname,
        phone: c.phone,
        birthdate: c.birthdate!,
        day: this.dayOf(c.birthdate!),
      }));

    const mechanicRows: BirthdayRow[] = this.mechanics()
      .filter((m) => m.birthdate && this.monthOf(m.birthdate) === month)
      .map((m) => ({
        type: 'MECHANIC',
        id: m.id,
        name: m.name,
        lastname: m.lastname,
        phone: m.phone,
        birthdate: m.birthdate!,
        day: this.dayOf(m.birthdate!),
      }));

    return [...customerRows, ...mechanicRows].sort((a, b) => a.day - b.day);
  });

  readonly appliedMonthLabel = computed(() => MONTH_NAMES[this.appliedMonth() - 1]);

  search(): void {
    this.appliedMonth.set(this.filterForm.value.month ?? this.currentMonth);
  }

  onClearFilters(): void {
    this.filterForm.reset({ month: this.currentMonth });
    this.appliedMonth.set(this.currentMonth);
  }

  typeLabel(type: BirthdayEntityType): string {
    return type === 'CUSTOMER' ? 'Cliente' : 'Mecánico';
  }

  isTodayBirthday(birthdate: string): boolean {
    const date = new Date(birthdate + 'T00:00:00');
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth();
  }

  private monthOf(birthdate: string): number {
    return new Date(birthdate + 'T00:00:00').getMonth() + 1;
  }

  private dayOf(birthdate: string): number {
    return new Date(birthdate + 'T00:00:00').getDate();
  }
}
