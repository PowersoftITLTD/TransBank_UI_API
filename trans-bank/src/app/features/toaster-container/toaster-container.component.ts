import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ToasterComponent } from '../toaster-container/toaster/toaster.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToasterService } from '../../core/services/toaster.service';
import { Toast } from '../../core/models/toaster.interface';

@Component({
  selector: 'app-toaster-container',
  standalone: true,
  imports: [
    ToasterComponent,
  ],
  templateUrl: './toaster-container.component.html',
  styleUrls: ['./toaster-container.component.scss']
})
export class ToasterContainerComponent implements OnInit {

  toasts: Toast[] = [];
  private destroyRef = inject(DestroyRef);

  constructor(public toaster: ToasterService) {}  // <-- MUST be public

 ngOnInit() {
    this.toaster.toast$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(toast => {
        this.toasts = [toast, ...this.toasts];
        setTimeout(() => this.removeToast(toast), toast.delay || 6000);
      });
  }

  remove(index: number) {
    this.toasts = this.toasts.filter((_, i) => i !== index);
  }

  private removeToast(toast: Toast): void {
    this.toasts = this.toasts.filter((current) => current !== toast);
  }
}
