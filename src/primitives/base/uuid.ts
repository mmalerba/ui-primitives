import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Uuid {
  id = 0;

  next() {
    return this.id++;
  }
}
