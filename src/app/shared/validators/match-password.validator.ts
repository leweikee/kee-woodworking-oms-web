import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function MatchPasswordValidator(passwordKey: string, confirmPasswordKey: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(passwordKey)?.value;
    const confirmPassword = group.get(confirmPasswordKey)?.value;

    if (password !== confirmPassword) {
      group.get(confirmPasswordKey)?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      const confirmControl = group.get(confirmPasswordKey);
      if (confirmControl?.hasError('passwordMismatch')) {
        confirmControl.setErrors(null);
      }
      return null;
    }
  };
}
