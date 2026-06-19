import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { toSignal } from '@angular/core/rxjs-interop';
import { Customer } from '../../../../core/models/customer.model';
import { Vehicle } from '../../../../core/models/vehicle.model';
import { Mechanic } from '../../../../core/models/mechanic.model';
import { SPCustomer } from '../../../../core/services/supabase/sb-customer';
import { SPVehicle } from '../../../../core/services/supabase/sb-vehicles';
import { SPMechanic } from '../../../../core/services/supabase/sb-mechanic';
import { CustomerFormModal } from '../../../workshop/customers/components/customer-form-modal/customer-form-modal';

export interface CustomerTabValue {
  customer_id: string | null;
  vehicle_id: string | null;
  mechanic_id: string | null;
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
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './tab-customer.html',
  styleUrl: './tab-customer.scss',
})
export class TabCustomer implements OnInit {
  private customerService = inject(SPCustomer);
  private vehicleService = inject(SPVehicle);
  private mechanicService = inject(SPMechanic);
  private dialog = inject(MatDialog);

  initialValue = input<CustomerTabValue | null>(null);
  valueChange = output<CustomerTabValue>();

  readonly allCustomers = toSignal(this.customerService.get(), { initialValue: [] });
  readonly allVehicles = toSignal(this.vehicleService.get(), { initialValue: [] });
  readonly allMechanics = toSignal(this.mechanicService.get(), { initialValue: [] });

  readonly customerCtrl = new FormControl<Customer | string | null>(null);
  readonly vehicleCtrl = new FormControl<Vehicle | string | null>(null);
  readonly mechanicCtrl = new FormControl<Mechanic | string | null>(null);

  private readonly customerCtrlValue = toSignal(this.customerCtrl.valueChanges, { initialValue: null });
  private readonly vehicleCtrlValue = toSignal(this.vehicleCtrl.valueChanges, { initialValue: null });
  private readonly mechanicCtrlValue = toSignal(this.mechanicCtrl.valueChanges, { initialValue: null });

  readonly selectedCustomer = signal<Customer | null>(null);
  readonly selectedVehicle = signal<Vehicle | null>(null);
  readonly selectedMechanic = signal<Mechanic | null>(null);

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

  readonly filteredMechanics = computed(() => {
    const val = this.mechanicCtrlValue();
    const all = this.allMechanics().filter((m) => m.state === 'ACTIVE');
    if (!val || typeof val !== 'string') return all;
    const term = val.toLowerCase().trim();
    return all.filter((m) => this.mechanicLabel(m).toLowerCase().includes(term));
  });

  readonly form = new FormGroup({
    number: new FormControl<string>(''),
    mileage: new FormControl<string>(''),
    started_date: new FormControl<Date | null>(null),
    ended_date: new FormControl<Date | null>(null),
  });

  ngOnInit(): void {
    this.form.valueChanges.subscribe(() => this.emitValue());

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

    this.mechanicCtrl.valueChanges.subscribe((val) => {
      const mechanic = typeof val === 'object' && val !== null ? (val as Mechanic) : null;
      this.selectedMechanic.set(mechanic);
      this.emitValue();
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

  mechanicLabel(m: Mechanic): string {
    return [m.name, m.lastname].filter(Boolean).join(' ') || m.id;
  }

  displayMechanic = (value: Mechanic | string | null): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return this.mechanicLabel(value);
  };

  private emitValue(): void {
    const raw = this.form.value;
    this.valueChange.emit({
      customer_id: this.selectedCustomer()?.id ?? null,
      vehicle_id: this.selectedVehicle()?.id ?? null,
      mechanic_id: this.selectedMechanic()?.id ?? null,
      number: raw.number || null,
      mileage: raw.mileage || null,
      started_date: raw.started_date ? this.toIsoDate(raw.started_date) : null,
      ended_date: raw.ended_date ? this.toIsoDate(raw.ended_date) : null,
    });
  }

  openNewCustomerDialog(): void {
    const ref = this.dialog.open(CustomerFormModal, {
      data: {},
      width: '48rem',
      maxWidth: '95vw',
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

  private toIsoDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }
}
