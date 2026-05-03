import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
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

import { AppointmentService } from '../../services/appointment.service';

function toYmd(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseYmd(value: string): Date | null {
  // value is expected to be YYYY-MM-DD from <input type="date">.
  const parts = value.split('-');
  if (parts.length !== 3) return null;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function notInPastDateValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string | null | undefined;
  if (!value) return null;

  const selected = parseYmd(value);
  if (!selected) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return selected < today ? { dateInPast: true } : null;
}

function notInPastDateTimeValidator(control: AbstractControl): ValidationErrors | null {
  // Form-level validation so we can compare date + time with "now".
  const group = control as {
    get(path: string): AbstractControl | null;
  };

  const dateValue = group.get('date')?.value as string | null | undefined;
  const timeValue = group.get('time')?.value as string | null | undefined;
  if (!dateValue || !timeValue) return null;

  const date = parseYmd(dateValue);
  if (!date) return null;

  const parts = timeValue.split(':');
  if (parts.length !== 2) return null;

  const hh = Number(parts[0]);
  const mm = Number(parts[1]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;

  const dateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hh, mm, 0, 0);
  const now = new Date();

  return dateTime < now ? { dateTimeInPast: true } : null;
}

type AppointmentState = {
  id?: number | string | null;
  title?: string | null;
  description?: string | null;
  date?: string | null;
  time?: string | null;
  user_id?: number | string | null;
};

@Component({
  standalone: true,
  selector: 'app-add-appointment',
  templateUrl: './add-appointment.component.html',
  styleUrls: ['./add-appointment.component.css'],
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
export class AddAppointmentComponent implements OnInit {
  saving = false;
  isEdit = false;

  readonly minDate = toYmd(new Date());

  private editId: number | null = null;
  private userId = 1;

  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group(
    {
      title: ['', [Validators.required, Validators.maxLength(80)]],
      description: ['', [Validators.maxLength(400)]],
      date: ['', [Validators.required, notInPastDateValidator]],
      time: ['', [Validators.required]],
    },
    { validators: notInPastDateTimeValidator },
  );

  constructor(
    private service: AppointmentService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  get title() {
    return this.form.controls.title;
  }
  get description() {
    return this.form.controls.description;
  }
  get date() {
    return this.form.controls.date;
  }
  get time() {
    return this.form.controls.time;
  }

  ngOnInit() {
    const state = (history.state?.appointment ?? null) as AppointmentState | null;
    if (state && typeof state === 'object') {
      const id = state.id === undefined || state.id === null ? null : Number(state.id);
      if (Number.isFinite(id)) {
        this.isEdit = true;
        this.editId = id;
        this.userId = state.user_id === undefined || state.user_id === null ? 1 : Number(state.user_id) || 1;

        this.form.patchValue({
          title: state.title ?? '',
          description: state.description ?? '',
          date: state.date ?? '',
          time: state.time ?? '',
        });
        return;
      }
    }

    // Default date to today so the user doesn't accidentally pick a past date.
    this.form.patchValue({ date: this.minDate });
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Veuillez corriger les champs en rouge.', 'OK', {
        duration: 3500,
        verticalPosition: 'top',
        horizontalPosition: 'center',
        panelClass: ['snack-error'],
      });
      return;
    }

    this.saving = true;
    const payload = { ...this.form.getRawValue(), user_id: this.userId };

    const request$ =
      this.isEdit && this.editId !== null ? this.service.update(this.editId, payload) : this.service.add(payload);

    request$.subscribe({
      next: () => {
        this.router.navigateByUrl('/calendar', {
          state: { flash: this.isEdit ? 'updated' : 'created' },
        });
      },
      error: (err: unknown) => {
        const message = err instanceof HttpErrorResponse ? (err.error?.message as string | undefined) : undefined;
        this.snackBar.open(message ?? "Erreur lors de l'enregistrement.", 'OK', {
          duration: 4500,
          verticalPosition: 'top',
          horizontalPosition: 'center',
          panelClass: ['snack-error'],
        });
        this.saving = false;
      },
      complete: () => {
        this.saving = false;
      },
    });
  }
}
