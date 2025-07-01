import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { first, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { PasswordStrengthValidator } from '../../shared/validators/password-strength.validator'; 

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    NzFormModule, NzInputModule, NzButtonModule, NzIconModule, NzSpinModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  public loginForm!: FormGroup;
  public loading = false;
  public returnUrl!: string;
  public passwordVisible = false;
  public errorMessage: string | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder, private route: ActivatedRoute, private router: Router, 
    private authService: AuthService, private message: NzMessageService
  ) { }

  ngOnInit() {
    this.buildForm();
    this.checkReturnUrl();
    this.checkExistingSession();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  buildForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required,Validators.minLength(8),PasswordStrengthValidator()]]
    });
  }

  checkReturnUrl(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  checkExistingSession(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate([this.returnUrl]);
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid || this.loading) {
      this.validateAllFormFields();
      return;
    }

    this.errorMessage = null;
    this.loading = true;

    const obj = {
      Email: this.email.value,
      Password: this.password.value
    }
    this.authService.login(obj)
      .pipe(
      first(),
      takeUntil(this.destroy$)
    )
      .subscribe({
        next: (user) => {
        this.message.success('Login successful');
        if (user?.isFirstLogin) {
          this.router.navigate(['/change-password']);
        } else {
          this.loading = false;
          this.router.navigate(['/home']); //temporarily put users, should put dashboard
        }
      },
      error: (error) => {
        this.message.error(error.message);
        this.loading = false;
      }
    });
  }

  onForgotPassword(): void {
    this.router.navigate(['/change-password']);
  }
  
  validateAllFormFields(): void {
    Object.values(this.loginForm.controls).forEach(control => {
      if (control.invalid) {
        control.markAsDirty();
        control.updateValueAndValidity({ onlySelf: true });
      }
    });
  }

  handleError(error: any): void {
    let errorMsg = 'Login failed. Please try again.';
    
    if (error.error?.message) {
      errorMsg = error.error.message;
    } else if (error.status === 0) {
      errorMsg = 'Unable to connect to server. Please check your connection.';
    } else if (error.status === 401) {
      errorMsg = 'Invalid username or password';
    } else if (error.status === 403) {
      errorMsg = 'Account disabled. Please contact administrator.';
    }

    this.errorMessage = errorMsg;
    this.message.error(errorMsg);
  }
  
  get form() { return this.loginForm.controls; }
  get email() { return this.loginForm.controls['email']; }
  get password() { return this.loginForm.controls['password']; }
}