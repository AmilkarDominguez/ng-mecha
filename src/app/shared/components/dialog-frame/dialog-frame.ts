import { Component, inject, input, OnInit, signal, computed } from '@angular/core';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

export type DialogSize = 'sm' | 'md' | 'lg';
type DialogState = 'normal' | 'minimized' | 'fullscreen';

const SIZE_MAP: Record<DialogSize, string> = {
  sm: '32rem',
  md: '48rem',
  lg: '64rem',
};

@Component({
  selector: 'app-dialog-frame',
  standalone: true,
  imports: [CdkDrag, CdkDragHandle, MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule],
  templateUrl: './dialog-frame.html',
  styleUrl: './dialog-frame.scss',
})
export class DialogFrame implements OnInit {
  private dialogRef = inject(MatDialogRef<unknown>);

  title = input.required<string>();
  icon = input<string>('edit');
  initialSize = input<DialogSize>('md');

  readonly state = signal<DialogState>('normal');
  readonly currentSize = signal<DialogSize>('md');

  readonly isMinimized = computed(() => this.state() === 'minimized');
  readonly isFullscreen = computed(() => this.state() === 'fullscreen');
  readonly isDraggable = computed(() => !this.isFullscreen());

  readonly sizeOptions: { key: DialogSize; label: string; icon: string }[] = [
    { key: 'sm', label: 'Compacto', icon: 'crop_din' },
    { key: 'md', label: 'Normal', icon: 'crop_square' },
    { key: 'lg', label: 'Grande', icon: 'square' },
  ];

  ngOnInit(): void {
    const size = this.initialSize();
    this.currentSize.set(size);
    this.dialogRef.updateSize(SIZE_MAP[size]);
  }

  toggleMinimize(): void {
    this.state.set(this.isMinimized() ? 'normal' : 'minimized');
  }

  toggleFullscreen(): void {
    if (this.isFullscreen()) {
      this.state.set('normal');
      this.dialogRef.updateSize(SIZE_MAP[this.currentSize()]);
    } else {
      this.state.set('fullscreen');
      this.dialogRef.updateSize('100vw', '100vh');
    }
  }

  setSize(size: DialogSize): void {
    this.currentSize.set(size);
    if (!this.isFullscreen()) {
      this.dialogRef.updateSize(SIZE_MAP[size]);
    }
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
