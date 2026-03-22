import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AccountType } from '@models/account-type.enum';

@Component({
  selector: 'app-transfer-form',
  standalone: true,
  templateUrl: './transfer-form.component.html',
  styleUrls: ['./transfer-form.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
})
export class TransferFormComponent implements OnInit, OnDestroy {
  transferForm: FormGroup;
  private destroy$ = new Subject<void>();
  
  public readonly AccountType = AccountType;
  today: string = new Date().toISOString().split('T')[0];
  isSubmitting: boolean = false;
  showSuccess: boolean = false;

  constructor(
    private fb: FormBuilder,
    private datePipe: DatePipe
  ){
    this.transferForm = this.fb.group({
      beneficiary: this.fb.group({
        name: ['', [
          Validators.required, 
          Validators.minLength(3),
          Validators.pattern(/^[a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ\s]*$/)
        ]],
        accountType: [AccountType.NATIONAL, Validators.required]
      }),
      details: this.fb.group({
        iban: ['', [Validators.required, this.ibanValidator.bind(this)]],
        amount: [null, [Validators.required, Validators.min(0.01)]],
        transferDate: [this.today, [Validators.required, this.futureDateValidator]],
        swiftCode: ['']
      })
    });
  }

  ngOnInit(): void {
    this.setupDynamicValidators();
  }

  private setupDynamicValidators(): void {
    const accountTypeControl = this.transferForm.get('beneficiary.accountType');

    accountTypeControl?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(type => {

        const ibanControl = this.transferForm.get('details.iban');
        const swiftControl = this.transferForm.get('details.swiftCode');
      
        ibanControl?.setValue('', { emitEvent: false });
        swiftControl?.setValue('', { emitEvent: false });
             
        if (type === AccountType.NATIONAL) {
          ibanControl?.setValidators([Validators.required, this.ibanValidator.bind(this)]);
          swiftControl?.clearValidators();
        } else {
          ibanControl?.setValidators([Validators.required, this.ibanValidator.bind(this)]);
          swiftControl?.setValidators([Validators.required, this.swiftValidator.bind(this)]);
        }      

        swiftControl?.updateValueAndValidity();
        ibanControl?.updateValueAndValidity();
      });
  }

  private swiftValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value?.toUpperCase();
    const swiftRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
    return value && !swiftRegex.test(value) ? { invalidSwift: true } : null;
  }

  private ibanValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value?.toUpperCase().replace(/\s/g, '');
    if (!value) return null;
  
    const accountType = control.parent?.get('accountType')?.value || 
                        this.transferForm.get('beneficiary.accountType')?.value;
  
    if (accountType === AccountType.NATIONAL) {
      const ptRegex = /^PT50\d{21}$/;
      return ptRegex.test(value) ? null : { invalidIbanPT: true };
    } else {
      const intRegex = /^[A-Z]{2}[0-9A-Z]{12,34}$/;
      return intRegex.test(value) ? null : { invalidIbanInt: true };
    }
  }

  private futureDateValidator(control: AbstractControl): ValidationErrors | null {
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    return selectedDate < today ? { pastDate: true } : null;
  }

  formatCurrency(event: any) {
    const value = event.target.value;
    if (value) {
      const formatted = new Intl.NumberFormat('pt-PT', {
        style: 'currency',
        currency: 'EUR'
      }).format(value);
    }
  }

  handleIBANInput(event: any): void {
    const input = event.target;
    const type = this.transferForm.get('beneficiary.accountType')?.value;
    
    let val = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (type === AccountType.NATIONAL) {

      if (val.length > 0 && !val.startsWith('PT50')) {
        val = 'PT50' + val;
      }
      val = val.substring(0, 25);
    } else {
      val = val.substring(0, 34);
    }

    this.transferForm.get('details.iban')?.patchValue(val, { emitEvent: false });
  }

  filterAlphabetical(event: Event): void {
    const input = event.target as HTMLInputElement;
    const rawValue = input.value;
    
    const sanitized = rawValue.replace(/[^a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ\s]/g, '');
    
    if (rawValue !== sanitized) {
      input.value = sanitized;
    }
    
    this.transferForm.get('beneficiary.name')?.patchValue(sanitized, { emitEvent: true });
    this.transferForm.get('beneficiary.name')?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.transferForm.valid) {
      this.isSubmitting = true;
      this.showSuccess = false;

    setTimeout(() => {
      console.log('Backend Payload:', this.transferForm.value);
      this.isSubmitting = false;
      this.showSuccess = true;

      setTimeout(() => {

        const successAlert = document.querySelector('.app-header');
        if (successAlert) {
          successAlert.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);

      setTimeout(() => {
        this.resetForm();
      }, 8000);

    }, 2000);
  } else {
    this.transferForm.markAllAsTouched();
  }
}

resetForm(): void {
  this.showSuccess = false;
  this.transferForm.reset({
    beneficiary: {
      name: '', 
      accountType: 'NATIONAL' 
    },
    details: { 
      iban: '',
      amount: null,
      transferDate: this.today,
      swiftCode: ''
    }
  });

  //(document.querySelector('input[formControlName="iban"]') as HTMLInputElement).value = '';
}

  onSwiftFocus(): void {
    this.transferForm.get('details.swiftCode')?.markAsUntouched();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}