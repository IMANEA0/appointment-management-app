import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';

import { AppointmentService } from '../../services/appointment.service';
import { AddAppointmentComponent } from './add-appointment.component';

describe('AddAppointmentComponent', () => {
  let component: AddAppointmentComponent;
  let fixture: ComponentFixture<AddAppointmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddAppointmentComponent],
      providers: [
        provideRouter([]),
        {
          provide: AppointmentService,
          useValue: {
            add: () => of(null),
            update: () => of(null),
          },
        },
        {
          provide: MatSnackBar,
          useValue: { open: () => undefined },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddAppointmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

