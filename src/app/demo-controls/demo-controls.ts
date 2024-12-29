import { Component, computed, input, signal } from '@angular/core';
import { ModifierKey } from '../../primitives/base/event-manager';
import { KeyboardEventManager } from '../../primitives/base/keyboard-event-manager';

interface Command {
  name: string;
  description: string;
  match: RegExp | ((c: string) => boolean);
  run: (c: string) => void;
}

@Component({
  selector: 'demo-controls',
  templateUrl: './demo-controls.html',
  styleUrls: ['./demo-controls.css'],
  host: {
    '[class.active]': 'active()',
  },
})
export class DemoControls {
  readonly commands = input.required<Command[]>();

  private startCommandHandler = new KeyboardEventManager().on(ModifierKey.Shift, '>', () => {
    this.handler.set(this.commandHandler);
  });
  private commandHandler = new KeyboardEventManager({ stopPropagation: true })
    .on(
      [ModifierKey.None, ModifierKey.Shift],
      (key) => key.length === 1,
      (e) => {
        this.command.set(this.command() + e.key);
      },
    )
    .on('Enter', () => {
      this.runCommand();
      this.command.set('');
      this.handler.set(this.startCommandHandler);
    })
    .on('Escape', () => {
      this.command.set('');
      this.handler.set(this.startCommandHandler);
    })
    .on('Backspace', () => {
      this.command.set(this.command().slice(0, -1));
    })
    .on(
      () => true,
      () => {},
    );

  readonly command = signal('');
  protected handler = signal(this.startCommandHandler);
  readonly active = computed(() => this.handler() === this.commandHandler);

  constructor() {
    typeof window !== 'undefined' &&
      window.addEventListener(
        'keydown',
        (e) => {
          this.handler().handle(e);
        },
        { capture: true },
      );
  }

  private runCommand() {
    for (const command of this.commands()) {
      if (
        typeof command.match === 'function'
          ? command.match(this.command())
          : command.match.test(this.command())
      ) {
        command.run(this.command());
        return;
      }
    }
  }
}
