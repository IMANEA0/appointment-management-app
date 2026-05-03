import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';

import { CalendarComponent } from './calendar.component';
import { AppointmentService } from '../../services/appointment.service';

describe('CalendarComponent', () => {
  let component: CalendarComponent;
  let fixture: ComponentFixture<CalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarComponent],
      providers: [
        provideRouter([]),
        {
          provide: AppointmentService,
          useValue: {
            getAll: () => of([]),
            delete: () => of(null),
            update: () => of(null),
            add: () => of(null),
          },
        },
        {
          provide: MatSnackBar,
          useValue: { open: () => undefined },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
