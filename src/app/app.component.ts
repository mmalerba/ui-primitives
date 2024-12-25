import { Component } from '@angular/core';
import { ListboxDemo } from './listbox-demo/listbox-demo';

let nextId = 0;

@Component({
    selector: 'app-root',
    imports: [ListboxDemo],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {
  rovingFocus = true;
  followFocus = true;
}
