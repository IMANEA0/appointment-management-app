import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private url = 'http://localhost:3000/appointments';

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.url);
  }

  add(data: any): Observable<any> {
    return this.http.post(this.url, data);
  }

  delete(id: number) {
    return this.http.delete(`${this.url}/${id}`);
  }

  update(id: number, data: any) {
    return this.http.put(`${this.url}/${id}`, data);
  }
}
