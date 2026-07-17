import { Component, computed, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { toSignal } from '@angular/core/rxjs-interop';
import { Customer } from '../../../../core/models/customer.model';
import { Vehicle } from '../../../../core/models/vehicle.model';
import { SPCustomer } from '../../../../core/services/supabase/sb-customer';
import { SPVehicle } from '../../../../core/services/supabase/sb-vehicles';
import { CustomerFormModal } from '../../../workshop/customers/components/customer-form-modal/customer-form-modal';

export interface QuoteCustomerTabValue {
  customer_id: string | null;
  vehicle_id: string | null;
}

@Component({
  selector: 'app-quote-tab-customer',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './tab-customer.html',
  styleUrl: './tab-customer.scss',
})
export class QuoteTabCustomer implements OnInit {
  private customerService = inject(SPCustomer);
  private vehicleService = inject(SPVehicle);
  private dialog = inject(MatDialog);

  initialValue = input<QuoteCustomerTabValue | null>(null);
  valueChange = output<QuoteCustomerTabValue>();

  constructor() {
    effect(() => {
      const initial = this.initialValue();
      const customers = this.allCustomers();
      const vehicles = this.allVehicles();

      if (!initial || customers.length === 0) return;
      if (this.selectedCustomer() !== null) return;

      if (initial.customer_id) {
        const customer = customers.find((c) => c.id === initial.customer_id) ?? null;
        if (customer) {
          this.customerCtrl.setValue(customer, { emitEvent: false });
          this.selectedCustomer.set(customer);
        }
      }
      if (initial.vehicle_id && vehicles.length > 0) {
        const vehicle = vehicles.find((v) => v.id === initial.vehicle_id) ?? null;
        if (vehicle) {
          this.vehicleCtrl.setValue(vehicle, { emitEvent: false });
          this.selectedVehicle.set(vehicle);
        }
      }
    });
  }

  readonly allCustomers = toSignal(this.customerService.get(), { initialValue: [] });
  readonly allVehicles = toSignal(this.vehicleService.get(), { initialValue: [] });

  readonly customerCtrl = new FormControl<Customer | string | null>(null);
  readonly vehicleCtrl = new FormControl<Vehicle | string | null>(null);

  private readonly customerCtrlValue = toSignal(this.customerCtrl.valueChanges, { initialValue: null });
  private readonly vehicleCtrlValue = toSignal(this.vehicleCtrl.valueChanges, { initialValue: null });

  readonly selectedCustomer = signal<Customer | null>(null);
  readonly selectedVehicle = signal<Vehicle | null>(null);

  readonly filteredCustomers = computed(() => {
    const val = this.customerCtrlValue();
    if (!val || typeof val !== 'string') return this.allCustomers();
    const term = val.toLowerCase().trim();
    return this.allCustomers().filter((c) => this.customerLabel(c).toLowerCase().includes(term));
  });

  readonly customerVehicles = computed(() => {
    const customer = this.selectedCustomer();
    if (!customer) return [];
    return this.allVehicles().filter((v) => v.customer_id === customer.id && v.state === 'ACTIVE');
  });

  readonly filteredVehicles = computed(() => {
    const val = this.vehicleCtrlValue();
    const vehicles = this.customerVehicles();
    if (!val || typeof val !== 'string') return vehicles;
    const term = val.toLowerCase().trim();
    return vehicles.filter((v) => this.vehicleLabel(v).toLowerCase().includes(term));
  });

  ngOnInit(): void {
    this.customerCtrl.valueChanges.subscribe((val) => {
      const customer = typeof val === 'object' && val !== null ? (val as Customer) : null;
      this.selectedCustomer.set(customer);
      this.vehicleCtrl.setValue(null, { emitEvent: false });
      this.selectedVehicle.set(null);
      this.emitValue();
    });

    this.vehicleCtrl.valueChanges.subscribe((val) => {
      if (typeof val === 'string') {
        this.selectedVehicle.set(null);
        this.emitValue();
      }
    });
  }

  displayCustomer = (value: Customer | string | null): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return this.customerLabel(value);
  };

  onVehicleSelected(event: MatAutocompleteSelectedEvent): void {
    this.selectedVehicle.set(event.option.value as Vehicle);
    this.emitValue();
  }

  displayVehicle = (value: Vehicle | string | null): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return this.vehicleLabel(value);
  };

  customerLabel(c: Customer): string {
    const name = [c.name, c.lastname].filter(Boolean).join(' ');
    return name || c.id;
  }

  vehicleLabel(v: Vehicle): string {
    const parts = [v.brand, v.model, v.license_plate].filter(Boolean);
    return parts.join(' - ') || v.id;
  }

  openNewCustomerDialog(): void {
    const ref = this.dialog.open(CustomerFormModal, {
      hasBackdrop: false,
      panelClass: 'floating-dialog-panel',
      data: {},
    });
    ref.afterClosed().subscribe((result: Customer | null) => {
      if (!result) return;
      this.customerService.add(result).subscribe({
        next: (saved) => {
          const newCustomer = saved[0];
          if (newCustomer) {
            this.customerCtrl.setValue(newCustomer);
          }
        },
      });
    });
  }

  private emitValue(): void {
    this.valueChange.emit({
      customer_id: this.selectedCustomer()?.id ?? null,
      vehicle_id: this.selectedVehicle()?.id ?? null,
    });
  }
}
