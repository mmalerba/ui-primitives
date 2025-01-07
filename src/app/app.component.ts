import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

let nextId = 0;

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  rovingFocus = true;
  followFocus = true;
}
