import { Component, computed, inject, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Service } from '../../../../core/models/service.model';
import { Mechanic } from '../../../../core/models/mechanic.model';
import { ServiceOrderServiceRow } from '../../../../core/models/service-order.model';
import { SPService } from '../../../../core/services/supabase/sb-service';
import { SPMechanic } from '../../../../core/services/supabase/sb-mechanic';

@Component({
  selector: 'app-tab-labor',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    DecimalPipe,
  ],
  templateUrl: './tab-labor.html',
  styleUrl: './tab-labor.scss',
})
export class TabLabor {
  private serviceProvider = inject(SPService);
  private mechanicProvider = inject(SPMechanic);
  private snackBar = inject(MatSnackBar);

  addItem = output<ServiceOrderServiceRow>();

  readonly allServices = toSignal(this.serviceProvider.get(), { initialValue: [] });
  readonly allMechanics = toSignal(this.mechanicProvider.get(), { initialValue: [] });

  readonly serviceCtrl = new FormControl<Service | string | null>(null);
  readonly mechanicCtrl = new FormControl<Mechanic | string | null>(null);

  private readonly serviceCtrlValue = toSignal(this.serviceCtrl.valueChanges, { initialValue: null });
  private readonly mechanicCtrlValue = toSignal(this.mechanicCtrl.valueChanges, { initialValue: null });

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

  readonly filteredMechanics = computed(() => {
    const val = this.mechanicCtrlValue();
    const all = this.allMechanics().filter((m) => m.state === 'ACTIVE');
    if (!val || typeof val !== 'string') return all;
    const term = val.toLowerCase().trim();
    return all.filter((m) => this.mechanicLabel(m).toLowerCase().includes(term));
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

  displayMechanic = (value: Mechanic | string | null): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return this.mechanicLabel(value);
  };

  mechanicLabel(m: Mechanic): string {
    return [m.name, m.lastname].filter(Boolean).join(' ') || m.id;
  }

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

    const mechanic = typeof this.mechanicCtrl.value === 'object' ? this.mechanicCtrl.value as Mechanic : null;
    const raw = this.form.value;
    const price = raw.price ?? 0;
    const quantity = raw.quantity ?? 1;

    this.addItem.emit({
      id: crypto.randomUUID(),
      service_id: service.id,
      mechanic_id: mechanic?.id ?? null,
      service_order_id: null,
      price,
      quantity,
      discount: 0,
      subtotal: price * quantity,
      service_name: service.name ?? '',
      mechanic_name: mechanic ? this.mechanicLabel(mechanic) : '—',
    });

    this.serviceCtrl.setValue(null);
    this.mechanicCtrl.setValue(null);
    this.selectedService.set(null);
    this.form.controls.price.disable();
    this.form.controls.quantity.disable();
    this.form.patchValue({ price: null, quantity: 1 });
  }
}
