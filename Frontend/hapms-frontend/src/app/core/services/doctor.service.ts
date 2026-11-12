import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/doctors';

  getDoctors(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      catchError(() => of([])), 
      map(apiDoctors => {
     
        const allLocalUsers = JSON.parse(localStorage.getItem('hapms_all_users_db') || '[]');
        
        const localDoctors = allLocalUsers
          .filter((u: any) => u.role === 'doctor' || u.role === 'Doctor')
          .filter((u: any) => !apiDoctors.some(apiDoc => apiDoc.id === u.id)) 
          .map((u: any) => ({
            id: u.id,
            name: u.fullName.startsWith('Dr.') ? u.fullName : `Dr. ${u.fullName}`,
            department: 'General Medicine', 
            specialty: 'General Practice'
          }));

        
        return [...apiDoctors, ...localDoctors];
      })
    );
  }
}