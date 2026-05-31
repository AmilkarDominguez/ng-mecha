import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TitleCasePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Customer } from '../../../../core/models/customer.model';
import { SPCustomer } from '../../../../core/services/supabase/sb-customer';
import { CustomerDetailModal } from '../../../workshop/customers/components/customer-detail-modal/customer-detail-modal';

@Component({
  selector: 'app-birthday-card',
  imports: [
    TitleCasePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './birthday-card.html',
  styleUrl: './birthday-card.scss',
})
export class BirthdayCard {
  private dialog = inject(MatDialog);
  private customerService = inject(SPCustomer);

  readonly customers = toSignal(this.customerService.listen(), { initialValue: [] });

  readonly currentMonth = new Date().getMonth() + 1;
  readonly currentMonthName = new Date().toLocaleDateString('es-ES', { month: 'long' });

  readonly birthdayCustomers = computed(() => {
    return this.customers()
      .filter((c) => {
        if (!c.birthdate) return false;
        const month = new Date(c.birthdate + 'T00:00:00').getMonth() + 1;
        return month === this.currentMonth;
      })
      .sort((a, b) => {
        const dayA = new Date(a.birthdate! + 'T00:00:00').getDate();
        const dayB = new Date(b.birthdate! + 'T00:00:00').getDate();
        return dayA - dayB;
      });
  });

  getBirthdayDay(birthdate: string): number {
    return new Date(birthdate + 'T00:00:00').getDate();
  }

  isTodayBirthday(birthdate: string): boolean {
    const date = new Date(birthdate + 'T00:00:00');
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth();
  }

  openDetail(customer: Customer): void {
    this.dialog.open(CustomerDetailModal, {
      hasBackdrop: false,
      panelClass: 'floating-dialog-panel',
      data: customer,
    });
  }
}
