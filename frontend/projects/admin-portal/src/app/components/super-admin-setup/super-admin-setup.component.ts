import { Component, inject, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RxFormBuilder, RxReactiveFormsModule } from '@rxweb/reactive-form-validators';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormField, MatInputModule, MatLabel } from '@angular/material/input';
import { OnSuccess, SetupStore } from './store/setup.store';
import { SignUpUserDto } from '@org.quicko.cliq/ngx-core';
import { userRoleEnum } from '@org.quicko.cliq/ngx-core';

@Component({
  selector: 'app-super-admin-setup',
  standalone: true,
  imports: [
    MatFormField,
    MatLabel,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    RxReactiveFormsModule,
    CommonModule,
  ],
  providers: [SetupStore],
  templateUrl: './super-admin-setup.component.html',
  styleUrls: ['./super-admin-setup.component.css']
})
export class SuperAdminSetupComponent implements OnInit {
  hidePassword = true;
  createSuperAdminForm: FormGroup;

  setupStore = inject(SetupStore);
  error = this.setupStore.error;

  constructor(private formBuilder: RxFormBuilder, private router: Router) {
    this.createSuperAdminForm = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit() {
    OnSuccess.subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

  onCreateSuperAdmin() {
    this.createSuperAdminForm.markAllAsTouched();

    if (this.createSuperAdminForm.invalid) {
      console.error('Form is invalid:', this.createSuperAdminForm.errors);
      return;
    }

    const formValue = this.createSuperAdminForm.value;
    
    // Split name into firstName and lastName
    const nameParts = formValue.name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const body = new SignUpUserDto();
    body.email = formValue.email;
    body.password = formValue.password;
    body.firstName = firstName;
    body.lastName = lastName;

    this.setupStore.createSuperAdmin({ body });
  }
}