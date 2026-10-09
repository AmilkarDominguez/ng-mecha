import { Component, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface ProcessListItem {
  description: string;
}

interface ProcessRow {
  localId: string;
  description: string;
}

/**
 * Checklist ordenable (CDK drag-drop) usado por el formulario de Servicios
 * y de Servicios Externos para registrar los "procesos" (pasos) de cada
 * uno — ver entities.md §Process. El valor expuesto via ControlValueAccessor
 * es simplemente `{ description }[]` en el orden visual actual; el mapeo a
 * `position` (indice del array) lo hace SPProcess.upsertForReference al
 * guardar, no este componente.
 */
@Component({
  selector: 'app-process-list-input',
  imports: [DragDropModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatTooltipModule],
  templateUrl: './process-list-input.html',
  styleUrl: './process-list-input.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ProcessListInput),
      multi: true,
    },
  ],
})
export class ProcessListInput implements ControlValueAccessor {
  readonly rows = signal<ProcessRow[]>([]);
  readonly newItemText = signal('');
  readonly disabled = signal(false);

  private onChange: (value: ProcessListItem[]) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: ProcessListItem[] | null): void {
    this.rows.set(
      (value ?? []).map((v) => ({ localId: crypto.randomUUID(), description: v.description ?? '' })),
    );
  }

  registerOnChange(fn: (value: ProcessListItem[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  onNewItemInput(event: Event): void {
    this.newItemText.set((event.target as HTMLInputElement).value);
  }

  addItem(): void {
    const text = this.newItemText().trim();
    if (!text) return;
    this.rows.update((rows) => [...rows, { localId: crypto.randomUUID(), description: text }]);
    this.newItemText.set('');
    this.emitChange();
  }

  removeItem(localId: string): void {
    this.rows.update((rows) => rows.filter((r) => r.localId !== localId));
    this.emitChange();
  }

  updateItemText(localId: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.rows.update((rows) => rows.map((r) => (r.localId === localId ? { ...r, description: value } : r)));
    this.emitChange();
  }

  drop(event: CdkDragDrop<ProcessRow[]>): void {
    const updated = [...this.rows()];
    moveItemInArray(updated, event.previousIndex, event.currentIndex);
    this.rows.set(updated);
    this.emitChange();
  }

  private emitChange(): void {
    this.onTouched();
    this.onChange(this.rows().map((r) => ({ description: r.description })));
  }
}
