import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../services/auth.service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const group = control as FormGroup;
  const password = group.get('password')?.value as string | null;
  const confirmPassword = group.get('confirmPassword')?.value as string | null;

  if (!password || !confirmPassword) return null;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  standalone: true,
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
  ],
})
export class RegisterComponent {
  submitting = false;

  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group(
    {
      name: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator },
  );

  constructor(
    private auth: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  get name() {
    return this.form.controls.name;
  }
  get email() {
    return this.form.controls.email;
  }
  get password() {
    return this.form.controls.password;
  }
  get confirmPassword() {
    return this.form.controls.confirmPassword;
  }

  register() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const { name, email, password } = this.form.getRawValue();

    this.auth.register({ name: name.trim() || undefined, email: email.trim(), password }).subscribe({
      next: () => {
        this.auth.setProfile({ name: name.trim() || undefined, email: email.trim() });
        this.snackBar.open('Compte cree. Vous pouvez vous connecter.', 'OK', { duration: 3500 });
        this.router.navigateByUrl('/login');
      },
      error: (err: unknown) => {
        const message = err instanceof HttpErrorResponse ? (err.error?.message as string | undefined) : undefined;

        this.snackBar.open(message ?? "Erreur lors de l'inscription.", 'OK', { duration: 4500 });
        this.submitting = false;
      },
      complete: () => {
        this.submitting = false;
      },
    });
  }
}
