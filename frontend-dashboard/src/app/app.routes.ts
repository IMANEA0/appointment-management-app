import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { CalendarComponent } from './components/calendar/calendar.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AddAppointmentComponent } from './pages/add-appointment/add-appointment.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'calendar', component: CalendarComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'add-appointment', component: AddAppointmentComponent },

  // redirection si route inconnue
  { path: '**', redirectTo: '' }
];
