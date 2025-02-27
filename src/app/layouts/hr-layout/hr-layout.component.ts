import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HrSidebarComponent } from "../../hr/components/hr-sidebar/hr-sidebar.component";

@Component({
  selector: 'app-hr-layout',
  imports: [RouterOutlet, HrSidebarComponent],
  templateUrl: './hr-layout.component.html',
  styleUrl: './hr-layout.component.css'
})
export class HrLayoutComponent {

}
