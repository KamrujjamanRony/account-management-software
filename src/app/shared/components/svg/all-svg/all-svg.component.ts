import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-all-svg',
  imports: [],
  templateUrl: './all-svg.component.html',
  styleUrl: './all-svg.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllSvgComponent {
  readonly icon = input<any>();

}
