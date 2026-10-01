import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
// import { AuthService } from '../../services/auth/auth.service';

// PrimeNG modules
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';

// import * as CryptoJS from 'crypto-js';

// Reactive Form Imports
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { SecureStorageService } from '../../core/services/secure-storage.service';
import { ToasterService } from '../../core/services/toaster.service';
import { filter, take } from 'rxjs';
import { selectIsAuthenticated } from '../../store/auth/auth.selectors';
import { AppState } from '../../store/root.reducer';
// import { ToasterContainerComponent } from '../../components/shared/toaster-container/toaster-container.component';
// import { ToasterService } from '../../services/toaster/toaster.service';
// import { SecureStorageService } from '../../services/secure/secure-storage.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    MessageModule,
    // ToasterContainerComponent
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {

  loginForm: FormGroup;
  forgotPasswordForm: FormGroup;
  

  error = '';
  loginSuccess: boolean = false;
  isForgotEmail: boolean = false; // To toggle between forms

  // This key must exactly match what C# expects

  constructor(
    private auth: AuthService,
    private router: Router,
    private store: Store<AppState>,
    private toaster: ToasterService,
    private secureStorage: SecureStorageService
  ) {

    this.loginForm = new FormGroup({
      username: new FormControl('', [Validators.required, Validators.minLength(4)]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    });

    this.forgotPasswordForm = new FormGroup({
      email: new FormControl('', [Validators.required])
    })

  }

  get f() {
    return this.loginForm.controls;
  }

  get e() {
    return this.forgotPasswordForm.controls;
  }

  // onSubmit(): void {

  //   if (this.loginForm.invalid) {
  //     return;
  //   }

  //   const { username, password } = this.loginForm.value;

  //   try {
  //     const login_payload = {
  //       Username: username,
  //       Password: password
  //     }

  //     //`${username}:${password}`;      
  //     this.auth.login(login_payload, username, password).subscribe(

  //       (success) => {
  //         if (success) {
  //           this.loginSuccess = true;
  //           console.log('Check success status: ', this.loginSuccess);
  //           this.router.navigate(['balance']).then(() => {
  //             const encrypted_password = this.auth.encryptAES(password);
  //             sessionStorage.setItem('secure_pwd', encrypted_password);

  //             this.showSuccessToaster();
  //           });
  //         } else {
  //           this.error = 'Invalid credentials';
  //         }
  //       },
  //       (error) => {
  //         console.error('Login error:', error);
  //         // this.toaster.show('error', error.error.message, error.statusText, 5000);

  //         this.error = 'Login failed. Please try again.';
  //         // this.showErrorToaster();
  //       }
  //     );
  //   } catch (error) {
  //     console.error('Encryption error:', error);
  //     this.error = 'Encryption error occurred';
  //     this.showErrorToaster();
  //   }
  // }

  onSubmit(): void {
  if (this.loginForm.invalid) {
    return;
  }

  const { username, password } = this.loginForm.value;

  try {
    const login_payload = { Username: username, Password: password };
    
    this.auth.login(login_payload, username, password).subscribe(
      (success) => {
        if (success) {
          this.loginSuccess = true;

          // FIX: Wait for the store state to become true before navigating!
          this.store.select(selectIsAuthenticated).pipe(
            filter(isAuthenticated => isAuthenticated === true),
            take(1)
          ).subscribe(() => {
            // This runs safely ONLY after the store selector confirms login success
            this.router.navigate(['balance']).then(() => {
              // const encrypted_password = this.auth.encryptAES(password);
              // sessionStorage.setItem('secure_pwd', encrypted_password);
              this.showSuccessToaster();
            });
          });

        } else {
          this.error = 'Invalid credentials';
          this.toaster.show('error', 'Login failed', 'Check your username and password and try again.');
        }
      },
      (error) => {
        console.error('Login error:', error);
        this.error = 'Login failed. Please try again.';
        this.toaster.show('error', 'Login failed', 'Please try again.');
      }
    );
  } catch (error) {
    console.error('Encryption error:', error);
    this.error = 'Encryption error occurred';
    this.showErrorToaster();
  }
}
  onForgotEmailSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      return;
    }

    const { email } = this.forgotPasswordForm.value;

    console.log('Forgont password email: ', email)
    // Call an API to send the email to the user or to handle the forgot email functionality
    this.auth.forgotEmail(email).subscribe(
      (success) => {

        console.log('success: ', success)
        if(success) {
          // this.toaster.show('success', 'Email sent!', 'Please check your inbox for further instructions.');
          this.isForgotEmail = false;
        }else{
            // this.toaster.show('error', 'Invalid Email!', 'Please enter valid registerd email id');
        }

      },
      (error) => {
        console.error('Forgot email error:', error);
        // this.toaster.show('error', error.error.message, error.statusText, 5000);
      }
    );
  }

  toggleForgotEmail(): void {
    this.isForgotEmail = !this.isForgotEmail;
  }

  showSuccessToaster() {
    if (this.loginSuccess) {
      this.toaster.show('success', 'Login successful', 'You have successfully logged in.');
      this.loginSuccess = false;
    }
  }

  showErrorToaster() {
    this.toaster.show('error', 'Login error', 'Unable to complete login. Please try again.');
    this.loginSuccess = false;
  }
}
