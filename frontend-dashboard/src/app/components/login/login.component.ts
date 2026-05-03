import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
  ],
})
export class LoginComponent {
  loggingIn = false;

  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  constructor(
    private auth: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  get email() {
    return this.form.controls.email;
  }
  get password() {
    return this.form.controls.password;
  }

  login() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Veuillez remplir les champs correctement.', 'OK', { duration: 3200 });
      return;
    }
    if (this.loggingIn) return;

    this.loggingIn = true;
    const { email, password } = this.form.getRawValue();
    const trimmedEmail = email.trim();

    this.auth.login({ email: trimmedEmail, password }).subscribe({
      next: (res) => {
        this.auth.setSession(res.token, trimmedEmail);
        this.snackBar.open('Connexion reussie.', 'OK', { duration: 2400 });
        this.router.navigateByUrl('/dashboard');
      },
      error: (err: unknown) => {
        const message = err instanceof HttpErrorResponse ? (err.error?.message as string | undefined) : undefined;
        this.snackBar.open(message ?? 'Email ou mot de passe incorrect.', 'OK', { duration: 4000 });
        this.loggingIn = false;
      },
      complete: () => {
        this.loggingIn = false;
      },
    });
  }
}

