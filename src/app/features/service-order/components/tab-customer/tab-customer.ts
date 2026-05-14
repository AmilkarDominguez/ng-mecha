import {
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { toSignal } from '@angular/core/rxjs-interop';
import { Customer } from '../../../../core/models/customer.model';
import { Vehicle } from '../../../../core/models/vehicle.model';
import { SPCustomer } from '../../../../core/services/supabase/sb-customer';
import { SPVehicle } from '../../../../core/services/supabase/sb-vehicles';

export interface CustomerTabValue {
  customer_id: string | null;
  vehicle_id: string | null;
  number: string | null;
  mileage: string | null;
  started_date: string | null;
  ended_date: string | null;
}

@Component({
  selector: 'app-tab-customer',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
  ],
  templateUrl: './tab-customer.html',
  styleUrl: './tab-customer.scss',
})
export class TabCustomer implements OnInit {
  private customerService = inject(SPCustomer);
  private vehicleService = inject(SPVehicle);

  initialValue = input<CustomerTabValue | null>(null);
  valueChange = output<CustomerTabValue>();

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

  readonly form = new FormGroup({
    number: new FormControl<string>(''),
    mileage: new FormControl<string>(''),
    started_date: new FormControl<Date | null>(null),
    ended_date: new FormControl<Date | null>(null),
  });

  constructor() {
    effect(() => {
      const customer = typeof this.customerCtrl.value === 'object' && this.customerCtrl.value !== null
        ? this.customerCtrl.value as Customer
        : null;
      this.selectedCustomer.set(customer);
      this.vehicleCtrl.setValue(null, { emitEvent: false });
      this.selectedVehicle.set(null);
      this.emitValue();
    });

    effect(() => {
      const vehicle = typeof this.vehicleCtrl.value === 'object' && this.vehicleCtrl.value !== null
        ? this.vehicleCtrl.value as Vehicle
        : null;
      this.selectedVehicle.set(vehicle);
      this.emitValue();
    });
  }

  ngOnInit(): void {
    this.form.valueChanges.subscribe(() => this.emitValue());
  }

  displayCustomer = (value: Customer | string | null): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return this.customerLabel(value);
  };

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

  private emitValue(): void {
    const raw = this.form.value;
    this.valueChange.emit({
      customer_id: this.selectedCustomer()?.id ?? null,
      vehicle_id: this.selectedVehicle()?.id ?? null,
      number: raw.number || null,
      mileage: raw.mileage || null,
      started_date: raw.started_date ? this.toIsoDate(raw.started_date) : null,
      ended_date: raw.ended_date ? this.toIsoDate(raw.ended_date) : null,
    });
  }

  private toIsoDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }
}
