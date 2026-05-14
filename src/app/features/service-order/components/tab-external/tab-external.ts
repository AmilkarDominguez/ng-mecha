import { Component, computed, inject, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ExternalService } from '../../../../core/models/external-service.model';
import { BankAccount } from '../../../../core/models/bank-account.model';
import { ServiceOrderExternalServiceRow } from '../../../../core/models/service-order.model';
import { SPExternalService } from '../../../../core/services/supabase/sb-external-service';
import { SPBankAccount } from '../../../../core/services/supabase/sb-bank-account';

@Component({
  selector: 'app-tab-external',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatSelectModule,
    DecimalPipe,
  ],
  templateUrl: './tab-external.html',
  styleUrl: './tab-external.scss',
})
export class TabExternal {
  private externalServiceProvider = inject(SPExternalService);
  private bankAccountProvider = inject(SPBankAccount);
  private snackBar = inject(MatSnackBar);

  addItem = output<ServiceOrderExternalServiceRow>();

  readonly allExternalServices = toSignal(this.externalServiceProvider.get(), { initialValue: [] });
  readonly allBankAccounts = toSignal(this.bankAccountProvider.get(), { initialValue: [] });

  readonly externalServiceCtrl = new FormControl<ExternalService | string | null>(null);
  private readonly externalServiceCtrlValue = toSignal(this.externalServiceCtrl.valueChanges, { initialValue: null });

  readonly selectedExternalService = signal<ExternalService | null>(null);

  readonly filteredExternalServices = computed(() => {
    const val = this.externalServiceCtrlValue();
    const all = this.allExternalServices().filter((s) => s.state === 'ACTIVE');
    if (!val || typeof val !== 'string') return all;
    const term = val.toLowerCase().trim();
    return all.filter((s) => (s.name ?? '').toLowerCase().includes(term));
  });

  readonly form = new FormGroup({
    cost: new FormControl<number | null>({ value: null, disabled: true }, [Validators.required, Validators.min(0)]),
    price: new FormControl<number | null>({ value: null, disabled: true }, [Validators.required, Validators.min(0)]),
    quantity: new FormControl<number | null>({ value: 1, disabled: true }, [Validators.required, Validators.min(1)]),
    bank_account_id: new FormControl<string | null>({ value: null, disabled: true }),
  });

  displayExternalService = (value: ExternalService | string | null): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.name ?? '';
  };

  onExternalServiceSelected(service: ExternalService): void {
    this.selectedExternalService.set(service);
    this.form.controls.cost.enable();
    this.form.controls.price.enable();
    this.form.controls.quantity.enable();
    this.form.controls.bank_account_id.enable();
    this.form.patchValue({
      cost: service.cost ?? null,
      price: service.price ?? null,
      quantity: 1,
      bank_account_id: null,
    });
  }

  onExternalServiceInputChange(): void {
    const val = this.externalServiceCtrl.value;
    if (!val || typeof val === 'string') {
      this.selectedExternalService.set(null);
      this.form.controls.cost.disable();
      this.form.controls.price.disable();
      this.form.controls.quantity.disable();
      this.form.controls.bank_account_id.disable();
      this.form.patchValue({ cost: null, price: null, quantity: 1, bank_account_id: null });
    }
  }

  onAdd(): void {
    const service = this.selectedExternalService();
    if (!service) {
      this.snackBar.open('Seleccione un servicio externo', 'Cerrar', { duration: 2500 });
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.value;
    const price = raw.price ?? 0;
    const quantity = raw.quantity ?? 1;

    this.addItem.emit({
      id: crypto.randomUUID(),
      external_service_id: service.id,
      service_order_id: null,
      bank_account_id: raw.bank_account_id ?? null,
      cost: raw.cost ?? null,
      price,
      quantity,
      subtotal: price * quantity,
      external_service_name: service.name ?? '',
    });

    this.externalServiceCtrl.setValue(null);
    this.selectedExternalService.set(null);
    this.form.controls.cost.disable();
    this.form.controls.price.disable();
    this.form.controls.quantity.disable();
    this.form.controls.bank_account_id.disable();
    this.form.patchValue({ cost: null, price: null, quantity: 1, bank_account_id: null });
  }
}
