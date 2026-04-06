import {Component, inject, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormControl, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {merge} from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [MatFormFieldModule, MatInputModule, FormsModule, ReactiveFormsModule, MatButtonModule, MatIconModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  readonly email = new FormControl('', [Validators.required, Validators.email]);

  errorMessage = signal('');

  private readonly router = inject(Router);
  constructor() {
    merge(this.email.statusChanges, this.email.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateErrorMessage());
  }

  updateErrorMessage() {
    if (this.email.hasError('required')) {
      this.errorMessage.set('Debe ingresar un email');
    } else if (this.email.hasError('email')) {
      this.errorMessage.set('Correo no valido');
    } else {
      this.errorMessage.set('');
    }
  }

  hide = signal(true);
  clickEvent(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }

  login(){
    this.router.navigate(['/dashboard']);
  }
}
