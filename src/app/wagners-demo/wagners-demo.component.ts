import { Component } from "@angular/core";
import { uiListbox, uiListboxOption } from "../../primitives/listbox/listbox";

@Component({
  selector: 'wagners-demo',
  standalone: true,
  imports: [uiListbox, uiListboxOption],
  templateUrl: './wagners-demo.component.html',
  styleUrl: './wagners-demo.component.scss',
})
export class WagnersDemoComponent {}