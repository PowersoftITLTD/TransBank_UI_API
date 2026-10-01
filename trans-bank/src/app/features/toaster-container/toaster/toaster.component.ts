import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Toast } from '../../../core/models/toaster.interface';
// import { Toast } from '../../../services/toaster/toast.interface';



@Component({
  selector: 'app-toaster',
   standalone: true,
  templateUrl: `./toaster.component.html`,
  styleUrls: ['./toaster.component.scss']
})
export class ToasterComponent {
  @Input() toast!: Toast;
  @Input() i!: number;

  @Output() remove = new EventEmitter<number>();
}