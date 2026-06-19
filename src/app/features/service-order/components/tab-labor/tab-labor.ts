import { Component, computed, inject, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Service } from '../../../../core/models/service.model';
import { ServiceOrderServiceRow } from '../../../../core/models/service-order.model';
import { SPService } from '../../../../core/services/supabase/sb-service';
import { ServiceFormModal } from '../../../workshop/services/components/service-form-modal/service-form-modal';

@Component({
  selector: 'app-tab-labor',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    DecimalPipe,
  ],
  templateUrl: './tab-labor.html',
  styleUrl: './tab-labor.scss',
})
export class TabLabor {
  private serviceProvider = inject(SPService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  addItem = output<ServiceOrderServiceRow>();

  readonly allServices = toSignal(this.serviceProvider.get(), { initialValue: [] });

  readonly serviceCtrl = new FormControl<Service | string | null>(null);

  private readonly serviceCtrlValue = toSignal(this.serviceCtrl.valueChanges, { initialValue: null });

  readonly selectedService = signal<Service | null>(null);

  readonly filteredServices = computed(() => {
    const val = this.serviceCtrlValue();
    const all = this.allServices().filter((s) => s.state === 'ACTIVE');
    if (!val || typeof val !== 'string') return all;
    const term = val.toLowerCase().trim();
    return all.filter((s) =>
      (s.name ?? '').toLowerCase().includes(term) ||
      (s.code ?? '').toLowerCase().includes(term),
    );
  });

  readonly form = new FormGroup({
    price: new FormControl<number | null>({ value: null, disabled: true }, [Validators.required, Validators.min(0)]),
    quantity: new FormControl<number | null>({ value: 1, disabled: true }, [Validators.required, Validators.min(1)]),
  });

  displayService = (value: Service | string | null): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.name ?? '';
  };

  onServiceSelected(service: Service): void {
    this.selectedService.set(service);
    this.form.controls.price.enable();
    this.form.controls.quantity.enable();
    this.form.patchValue({ price: service.price ?? null, quantity: 1 });
  }

  onServiceInputChange(): void {
    const val = this.serviceCtrl.value;
    if (!val || typeof val === 'string') {
      this.selectedService.set(null);
      this.form.controls.price.disable();
      this.form.controls.quantity.disable();
      this.form.patchValue({ price: null, quantity: 1 });
    }
  }

  openNewServiceDialog(): void {
    const ref = this.dialog.open(ServiceFormModal, {
      data: {},
      width: '36rem',
      maxWidth: '95vw',
    });
    ref.afterClosed().subscribe((result: Service | null) => {
      if (!result) return;
      this.serviceProvider.add(result).subscribe({
        next: (saved) => {
          const newService = saved[0];
          if (newService) {
            this.serviceCtrl.setValue(newService);
            this.onServiceSelected(newService);
          }
        },
      });
    });
  }

  onAdd(): void {
    const service = this.selectedService();
    if (!service) {
      this.snackBar.open('Seleccione un servicio', 'Cerrar', { duration: 2500 });
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
      service_id: service.id,
      service_order_id: null,
      price,
      quantity,
      discount: 0,
      subtotal: price * quantity,
      service_name: service.name ?? '',
    });

    this.serviceCtrl.setValue(null);
    this.selectedService.set(null);
    this.form.controls.price.disable();
    this.form.controls.quantity.disable();
    this.form.patchValue({ price: null, quantity: 1 });
  }
}
