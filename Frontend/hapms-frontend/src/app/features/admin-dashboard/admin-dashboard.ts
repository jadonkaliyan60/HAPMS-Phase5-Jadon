import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-admin-dashboard',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss'
})
export class AdminDashboard implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder).nonNullable;
  private titleService = inject(Title);

  users = signal<any[]>([]);
  showForm = signal(false);

  staffForm = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    role: ['Doctor', Validators.required]
  });

  ngOnInit() {
    this.titleService.setTitle('Admin Portal - HAPMS');
    this.loadUsers();
  }

  loadUsers() {
    this.http.get<any[]>('http://localhost:3000/api/users').subscribe({
      next: (backendUsers) => {
        
        const localUsers = JSON.parse(localStorage.getItem('hapms_all_users_db') || '[]');
        const merged = [...backendUsers];
        for (const lu of localUsers) {
          if (!merged.some(u => u.email === lu.email)) {
            merged.push(lu);
          }
        }
        this.users.set(merged);
      },
      error: (err) => {
        console.warn("Backend down, showing offline users");
        
        const localUsers = JSON.parse(localStorage.getItem('hapms_all_users_db') || '[]');
        this.users.set(localUsers);
      }
    });
  }

  toggleForm() {
    this.showForm.update(v => !v);
    this.staffForm.reset({ role: 'Doctor' });
  }

  addStaff() {
    if (this.staffForm.invalid) return;
    
    this.staffForm.disable();
    const formValues = this.staffForm.getRawValue();
    
   
    const newUser = {
      id: 'STF-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      fullName: formValues.fullName,
      email: formValues.email,
      role: formValues.role.toLowerCase(),
      status: true
    };
    
    
    const localUsers = JSON.parse(localStorage.getItem('hapms_all_users_db') || '[]');
    localUsers.push(newUser);
    localStorage.setItem('hapms_all_users_db', JSON.stringify(localUsers));
    
    this.http.post('http://localhost:3000/api/users/staff', formValues).subscribe({
      next: () => { 
        this.staffForm.enable(); 
        this.loadUsers(); 
        this.toggleForm(); 
      },
      error: () => { 
        
        this.staffForm.enable(); 
        this.loadUsers(); 
        this.toggleForm(); 
      }
    });
  }

  deactivateUser(id: string) {
    if(confirm('Are you sure you want to deactivate this user?')) {
      const localUsers = JSON.parse(localStorage.getItem('hapms_all_users_db') || '[]');
      const updated = localUsers.map((u:any) => u.id === id ? {...u, status: false} : u);
      localStorage.setItem('hapms_all_users_db', JSON.stringify(updated));

      this.http.delete(`http://localhost:3000/api/users/${id}`).subscribe({
        next: () => this.loadUsers(),
        error: () => this.loadUsers() 
      });
    }
  }

  restoreUser(id: string) {
    const localUsers = JSON.parse(localStorage.getItem('hapms_all_users_db') || '[]');
    const updated = localUsers.map((u:any) => u.id === id ? {...u, status: true} : u);
    localStorage.setItem('hapms_all_users_db', JSON.stringify(updated));

    this.http.patch(`http://localhost:3000/api/users/${id}/restore`, {}).subscribe({
      next: () => this.loadUsers(),
      error: () => this.loadUsers() 
    });
  }

  hardDeleteUser(id: string) {
    if(confirm('WARNING: This will permanently delete the user. Are you sure?')) {
      const localUsers = JSON.parse(localStorage.getItem('hapms_all_users_db') || '[]');
      const filtered = localUsers.filter((u:any) => u.id !== id);
      localStorage.setItem('hapms_all_users_db', JSON.stringify(filtered));

      this.http.delete(`http://localhost:3000/api/users/${id}/permanent`).subscribe({
        next: () => this.loadUsers(),
        error: () => this.loadUsers() 
      });
    }
  }
}