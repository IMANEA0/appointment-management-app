import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AppointmentService } from '../../services/appointment.service';

type Appointment = {
  id: number;
  title: string;
  description: string;
  date: string; // expected: YYYY-MM-DD
  time: string; // expected: HH:mm
  user_id?: number;
};

type CalendarCell = {
  ymd: string; // '' for blank cells
  day: number; // 0 for blank cells
  inMonth: boolean;
  past: boolean;
  today: boolean;
  appointments: Appointment[];
};

function toYmd(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeYmd(value: string | null | undefined): string | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  // Support "DD/MM/YYYY" if older records exist.
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;

  return null;
}

function parseYmd(value: string): Date | null {
  const parts = value.split('-');
  if (parts.length !== 3) return null;

  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;

  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function monthKey(date: Date): number {
  return date.getFullYear() * 12 + date.getMonth();
}

@Component({
  standalone: true,
  selector: 'app-calendar',
  imports: [CommonModule, RouterModule, MatSnackBarModule],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
})
export class CalendarComponent implements OnInit {
  readonly weekdays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'] as const;

  appointments: Appointment[] = [];
  upcomingAppointments: Appointment[] = [];

  viewMonth = new Date();
  monthLabel = '';
  cells: CalendarCell[] = [];

  selectedYmd = toYmd(new Date());

  flashMessage: string | null = null;
  flashType: 'success' | 'error' = 'success';

  private readonly today = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  private flashTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private service: AppointmentService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {
    this.viewMonth.setDate(1);
    this.viewMonth.setHours(0, 0, 0, 0);
    this.updateMonthLabel();
  }

  ngOnInit(): void {
    const flash = (history.state?.flash ?? null) as string | null;
    if (flash === 'created') this.showFlash('Rendez-vous cree avec succes', 'success');
    if (flash === 'updated') this.showFlash('Rendez-vous mis a jour avec succes', 'success');

    this.loadAppointments();
  }

  get canGoPrev(): boolean {
    // Disable navigating to months before the current month.
    return monthKey(this.viewMonth) > monthKey(this.today);
  }

  prevMonth(): void {
    if (!this.canGoPrev) return;
    this.viewMonth = new Date(this.viewMonth.getFullYear(), this.viewMonth.getMonth() - 1, 1);
    this.updateMonthLabel();
    this.buildCells();
  }

  nextMonth(): void {
    this.viewMonth = new Date(this.viewMonth.getFullYear(), this.viewMonth.getMonth() + 1, 1);
    this.updateMonthLabel();
    this.buildCells();
  }

  selectDate(ymd: string): void {
    if (!ymd) return;
    this.selectedYmd = ymd;
  }

  selectAppointment(app: Appointment): void {
    const ymd = normalizeYmd(app.date);
    if (!ymd) return;

    this.selectedYmd = ymd;

    const date = parseYmd(ymd);
    if (!date) return;

    if (date.getFullYear() !== this.viewMonth.getFullYear() || date.getMonth() !== this.viewMonth.getMonth()) {
      this.viewMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      this.updateMonthLabel();
      this.buildCells();
    }
  }

  formatDate(value: string): string {
    const ymd = normalizeYmd(value);
    if (!ymd) return value;

    const date = parseYmd(ymd);
    if (!date) return value;

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  normalizeYmd(value: string): string | null {
    return normalizeYmd(value);
  }

  loadAppointments(): void {
    this.service.getAll().subscribe((data) => {
      this.appointments = data;
      this.upcomingAppointments = this.buildUpcomingAppointments(data);
      this.buildCells();
    });
  }

  deleteAppointment(id: number): void {
    if (!confirm('Supprimer ce rendez-vous ?')) return;

    this.service.delete(id).subscribe({
      next: () => {
        this.showFlash('Rendez-vous supprime avec succes', 'success');
        this.loadAppointments();
      },
      error: () => {
        this.showFlash('Erreur lors de la suppression', 'error');
        this.snackBar.open('Erreur lors de la suppression.', 'OK', { duration: 4000 });
      },
    });
  }

  editAppointment(app: Appointment): void {
    this.router.navigate(['/add-appointment'], {
      state: { appointment: app },
    });
  }

  private buildUpcomingAppointments(data: Appointment[]): Appointment[] {
    const todayYmd = toYmd(this.today);

    const upcoming = data
      .map((a) => ({ a, ymd: normalizeYmd(a.date) }))
      .filter((x): x is { a: Appointment; ymd: string } => !!x.ymd)
      .filter((x) => x.ymd >= todayYmd)
      .sort((x, y) => (x.ymd + (x.a.time ?? '')).localeCompare(y.ymd + (y.a.time ?? '')))
      .map((x) => x.a);

    return upcoming;
  }

  private updateMonthLabel(): void {
    const raw = this.viewMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    this.monthLabel = raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  private buildCells(): void {
    const byDate = new Map<string, Appointment[]>();
    const todayYmd = toYmd(this.today);
    for (const app of this.appointments) {
      const ymd = normalizeYmd(app.date);
      if (!ymd) continue;
      if (ymd < todayYmd) continue; // keep only today -> future
      const list = byDate.get(ymd) ?? [];
      list.push(app);
      byDate.set(ymd, list);
    }

    for (const list of byDate.values()) {
      list.sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
    }

    const year = this.viewMonth.getFullYear();
    const month = this.viewMonth.getMonth();
    const first = new Date(year, month, 1);
    const leading = first.getDay(); // Sunday=0...Saturday=6
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const total = Math.ceil((leading + daysInMonth) / 7) * 7;

    const nextCells: CalendarCell[] = [];

    for (let i = 0; i < total; i += 1) {
      const day = i - leading + 1;
      if (day < 1 || day > daysInMonth) {
        nextCells.push({
          ymd: '',
          day: 0,
          inMonth: false,
          past: false,
          today: false,
          appointments: [],
        });
        continue;
      }

      const date = new Date(year, month, day);
      const ymd = toYmd(date);

      nextCells.push({
        ymd,
        day,
        inMonth: true,
        past: ymd < todayYmd,
        today: ymd === todayYmd,
        appointments: byDate.get(ymd) ?? [],
      });
    }

    this.cells = nextCells;

    // Keep a visible selection when navigating months.
    const selected = parseYmd(this.selectedYmd);
    if (!selected || selected.getFullYear() !== year || selected.getMonth() !== month) {
      this.selectedYmd = monthKey(this.viewMonth) === monthKey(this.today) ? todayYmd : toYmd(first);
    }
  }

  private showFlash(message: string, type: 'success' | 'error'): void {
    this.flashMessage = message;
    this.flashType = type;

    if (this.flashTimer) clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => {
      this.flashMessage = null;
    }, 3500);
  }
}
