import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, catchError, delay } from 'rxjs';
import { User, UserRole } from '../models/user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  
  readonly user = signal<User | null>(null);
  readonly userRole = signal<UserRole | null>(null);
  readonly userFullName = signal<string | null>(null);
  private isAuthenticated = signal<boolean>(false);

  private readonly USERS_DB_KEY = 'hapms_all_users_db';

  constructor() {
    this.seedMockUsers();
    this.checkSession();
  }

  // Ensures the lecturer ALWAYS has the mock accounts available to test
  private seedMockUsers() {
    const existing = localStorage.getItem(this.USERS_DB_KEY);
    if (!existing) {
      const mockUsers: User[] = [
        { id: 'ADM-001', fullName: 'Alex Morgan', email: 'admin@hapms.demo', role: 'admin' },
        { id: 'DOC-001', fullName: 'Dr. Olivia Chen', email: 'doctor@hapms.demo', role: 'doctor' },
        { id: 'NUR-001', fullName: 'Sarah Mitchell', email: 'nurse@hapms.demo', role: 'nurse' },
        { id: 'PAT-00128', fullName: 'Emma Bennett', email: 'patient@hapms.demo', role: 'patient', patientNumber: 'PAT-00128' }
      ];
      localStorage.setItem(this.USERS_DB_KEY, JSON.stringify(mockUsers));
    }
  }

  login(email: string, password: string, rememberMe: boolean = false): Observable<User> {
    return this.http.post<User>('http://localhost:3000/api/auth/login', { email, password }).pipe(
      tap(loggedInUser => this.setSession(loggedInUser, rememberMe)),
      catchError(err => {
        console.warn('Backend login unavailable. Falling back to local offline database.');
        
        // Search our local offline database for the specific user who is logging in
        const allUsers = JSON.parse(localStorage.getItem(this.USERS_DB_KEY) || '[]');
        const foundUser = allUsers.find((u: User) => u.email === email);
        
        if (!foundUser) {
          throw new Error('Invalid email or password.');
        }
        
        // No more hard-coded "Emma Bennett"! It uses the foundUser's actual details.
        this.setSession(foundUser, rememberMe);
        return of(foundUser).pipe(delay(500));
      })
    );
  }

  register(userData: any): Observable<User> {
    return this.http.post<User>('http://localhost:3000/api/auth/register', userData).pipe(
      tap(registeredUser => {
        this.setSession(registeredUser, false);
        this.saveUserLocally(registeredUser);
      }),
      catchError(err => {
        console.warn('Backend register unavailable. Saving new account to local offline database.');
        
        const allUsers = JSON.parse(localStorage.getItem(this.USERS_DB_KEY) || '[]');
        if (allUsers.some((u: User) => u.email === userData.email)) {
           throw new Error('Email already exists.');
        }

        // Generate a secure, unique ID for the NEW patient
        const newId = 'PAT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const newUser: User = { 
          id: newId, 
          email: userData.email, 
          fullName: userData.fullName, 
          role: 'patient',
          patientNumber: newId
        };
        
        this.saveUserLocally(newUser);
        this.setSession(newUser, false);
        return of(newUser).pipe(delay(500));
      })
    );
  }

  private saveUserLocally(user: User) {
    const allUsers = JSON.parse(localStorage.getItem(this.USERS_DB_KEY) || '[]');
    if (!allUsers.some((u: User) => u.email === user.email)) {
      allUsers.push(user);
      localStorage.setItem(this.USERS_DB_KEY, JSON.stringify(allUsers));
    }
  }

  logout(): void {
    this.user.set(null);
    this.userRole.set(null);
    this.userFullName.set(null);
    this.isAuthenticated.set(false);
    localStorage.removeItem('session_user');
    sessionStorage.removeItem('session_user');
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  private setSession(user: User, rememberMe: boolean): void {
    this.user.set(user);
    this.userRole.set(user.role);
    this.userFullName.set(user.fullName);
    this.isAuthenticated.set(true);
    
    if (rememberMe) {
      localStorage.setItem('session_user', JSON.stringify(user));
    } else {
      sessionStorage.setItem('session_user', JSON.stringify(user));
    }
  }

  private checkSession(): void {
    const storedUser = localStorage.getItem('session_user') || sessionStorage.getItem('session_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        this.user.set(parsedUser);
        this.userRole.set(parsedUser.role);
        this.userFullName.set(parsedUser.fullName);
        this.isAuthenticated.set(true);
      } catch (e) {
        this.logout();
      }
    }
  }
}