import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { Vehicle } from '../../../../../core/models/vehicle.model';
import { SPCustomer } from '../../../../../core/services/supabase/sb-customer';

@Component({
  selector: 'app-vehicle-detail-modal',
  imports: [
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
  ],
  templateUrl: './vehicle-detail-modal.html',
  styleUrl: './vehicle-detail-modal.scss',
})
export class VehicleDetailModal {
  private dialogRef = inject(MatDialogRef<VehicleDetailModal>);
  readonly vehicle: Vehicle = inject(MAT_DIALOG_DATA);

  readonly customerName = toSignal(
    inject(SPCustomer)
      .get()
      .pipe(
        map((customers) => {
          const found = customers.find((c) => c.id === this.vehicle.customer_id);
          return found ? [found.name, found.lastname].filter(Boolean).join(' ') : null;
        }),
      ),
    { initialValue: null },
  );

  onClose(): void {
    this.dialogRef.close();
  }

  onPrint(): void {
    window.print();
  }
}
