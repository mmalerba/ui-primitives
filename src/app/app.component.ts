import { Component } from '@angular/core';
import { ListboxDemo } from './listbox-demo/listbox-demo';
import { WagnersDemoComponent } from './wagners-demo/wagners-demo.component';

let nextId = 0;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ListboxDemo, WagnersDemoComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  rovingFocus = true;
  followFocus = true;
}
