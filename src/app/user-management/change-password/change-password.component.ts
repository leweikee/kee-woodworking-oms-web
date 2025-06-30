import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { PasswordStrengthValidator } from '../../shared/validators/password-strength.validator'; 

import { UserManagementService } from '../user-management.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from '../../core/auth/auth.service';
import { MatchPasswordValidator } from '../../shared/validators/match-password.validator';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, 
    NzFormModule, NzInputModule, NzButtonModule
  ],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent implements OnInit {
  public passwordForm!: FormGroup;
  public loading = false;
  public isFirstLogin = false;
  public pageTitle: string = '';
  public isEmailSet = false;

  private currentUser: any;

  constructor(
    private fb: FormBuilder, private router: Router,
    private userService: UserManagementService, private message: NzMessageService, private authService: AuthService,
  ) { this.currentUser = this.authService.currentUserValue; }

  ngOnInit(): void {
    this.buildForm()
    if (this.currentUser) { 
      this.isEmailSet = !!this.currentUser.email; 
      this.isFirstLogin = this.currentUser.isFirstLogin;
    }
    if (this.isEmailSet) { this.email.setValue(this.currentUser.email); }

    if (this.isFirstLogin){ 
      this.pageTitle = 'Welcome!';
    }
    else {
      this.pageTitle = 'Reset Password';
    } 
  }

  buildForm(): void {
    this.passwordForm = this.fb.group({
      email: ['',[Validators.required, Validators.email]],
      newPassword: ['',[Validators.required,Validators.minLength(8),PasswordStrengthValidator()]],
      confirmPassword: ['',[Validators.required,Validators.minLength(8),PasswordStrengthValidator()]],
    }, {
      validators: MatchPasswordValidator('newPassword', 'confirmPassword')
    });
  }

  validateAllFormFields(): void {
    Object.values(this.passwordForm.controls).forEach(control => {
      if (control.invalid) {
        control.markAsDirty();
        control.updateValueAndValidity({ onlySelf: true });
      }
    });
  }

  onSubmit(): void {
    if (this.passwordForm.invalid || this.loading) {
      this.validateAllFormFields();
      return;
    }

    this.loading = true;
    const obj = {
      Email: this.email.value,
      Password: this.newPassword.value,
      ConfirmPassword: this.confirmPassword.value,
    }
    const response = this.userService.resetPassword(obj)
      .subscribe({
        next: (resp: any) => {
          this.loading = false;
          this.message.success(resp.message);
          this.router.navigate(['/login']);
        },
        error: (error) => {
          this.loading = false;
          this.message.error(`Error resetting password: ${error.message}`);
        }
      })
  }

  get email() { return this.passwordForm.controls['email'];}
  get newPassword() { return this.passwordForm.controls['newPassword']; }
  get confirmPassword() { return this.passwordForm.controls['confirmPassword']; }
}
