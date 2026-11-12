import { Component, input } from '@angular/core';

export type IconName =
  | 'dashboard'
  | 'calendar'
  | 'calendar-cancel'
  | 'bell'
  | 'check'
  | 'clock'
  | 'pin'
  | 'plus'
  | 'logout'
  | 'chevron'
  | 'menu'
  | 'close'
  | 'cross';

@Component({
  selector: 'app-icon',
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss',
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly paths: Record<IconName, string> = {
    dashboard: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
    calendar:
      'M8 2v4 M16 2v4 M3 9h18 M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2z M7 12h1 M12 12h1 M17 12h1 M7 16h1 M12 16h1 M17 16h1',
    'calendar-cancel':
      'M8 2v4 M16 2v4 M3 9h18 M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2z M10 12l4 4m0-4-4 4',
    bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21a2 2 0 0 0 4 0',
    check: 'M9 12l2 2 4-4 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
    clock: 'M12 6v6l4 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
    pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0 M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
    plus: 'M12 5v14 M5 12h14',
    logout: 'M9 4H4v16h5 M9 12h12 M16 7l5 5-5 5',
    chevron: 'm7 10 5 5 5-5',
    menu: 'M3 6h18 M3 12h18 M3 18h18',
    close: 'm6 6 12 12 M18 6 6 18',
    cross: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z',
  };
}
