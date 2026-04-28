import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { toSignal } from '@angular/core/rxjs-interop';
import { Customer } from '../../../core/models/customer.model';
import { SPCustomer } from '../../../core/services/supabase/sb-customer';
import { CustomerTable } from './components/customer-table/customer-table';
import {
  CustomerFormModal,
  CustomerFormData,
} from './components/customer-form-modal/customer-form-modal';
import { CustomerDetailModal } from './components/customer-detail-modal/customer-detail-modal';
import { CustomerDeleteConfirmModal } from './components/customer-delete-confirm-modal/customer-delete-confirm-modal';

@Component({
  selector: 'app-customer-dashboard',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    CustomerTable,
  ],
  templateUrl: './customer-dashboard.html',
  styleUrl: './customer-dashboard.scss',
})
export class CustomerDashboard {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private service = inject(SPCustomer);

  readonly customers = toSignal(this.service.listen(), { initialValue: [] });
  readonly searchTerm = signal('');

  readonly filteredCustomers = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.customers();
    return this.customers().filter(
      (c) =>
        (c.name ?? '').toLowerCase().includes(term) ||
        (c.lastname ?? '').toLowerCase().includes(term) ||
        (c.ci ?? '').toLowerCase().includes(term) ||
        (c.email ?? '').toLowerCase().includes(term) ||
        (c.phone ?? '').toLowerCase().includes(term),
    );
  });

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    const ref = this.dialog.open(CustomerFormModal, {
      width: '48rem',
      maxWidth: '95vw',
      data: {} satisfies CustomerFormData,
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      const newCustomer: Customer = {
        ...result,
        id: crypto.randomUUID(),
        state: result.state ?? 'ACTIVE',
      };

      this.service.add(newCustomer).subscribe(() => {
        this.snackBar.open('Cliente registrado correctamente', 'Cerrar', { duration: 3000 });
      });
    });
  }

  onEdit(customer: Customer): void {
    const ref = this.dialog.open(CustomerFormModal, {
      width: '48rem',
      maxWidth: '95vw',
      data: { customer } satisfies CustomerFormData,
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;

      this.service.update({ ...result, id: customer.id }).subscribe(() => {
        this.snackBar.open('Cliente actualizado correctamente', 'Cerrar', { duration: 3000 });
      });
    });
  }

  onView(customer: Customer): void {
    this.dialog.open(CustomerDetailModal, {
      width: '42rem',
      maxWidth: '95vw',
      data: customer,
    });
  }

  onDelete(customer: Customer): void {
    const ref = this.dialog.open(CustomerDeleteConfirmModal, {
      width: '28rem',
      maxWidth: '95vw',
      data: customer,
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      this.service.delete(customer.id).subscribe(() => {
        this.snackBar.open('Cliente eliminado', 'Cerrar', { duration: 3000 });
      });
    });
  }
}
