import { Injectable } from '@angular/core';
import { BehaviorSubject, filter, Observable } from 'rxjs';
import { Toast } from '../models/toaster.interface';
import { ToastType } from '../models/toaster.type';

@Injectable({
  providedIn: 'root'
})
export class ToasterService {

  subject: BehaviorSubject<Toast | null>;
  toast$: Observable<Toast>;

  constructor() {
    this.subject = new BehaviorSubject<Toast | null>(null);
    this.toast$ = this.subject.asObservable()
      .pipe(filter((toast): toast is Toast => toast !== null));
  }

  show(type: ToastType, title?: string, body?: string, delay?: number) {
    this.subject.next({
      type,
      title: title ?? '',
      body: body ?? '',
      delay: delay ?? 0
    });
  }
}