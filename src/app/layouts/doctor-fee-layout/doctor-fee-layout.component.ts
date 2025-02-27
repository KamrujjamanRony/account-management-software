import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DoctorFeeSidebarComponent } from "../../doctor-fee/components/doctor-fee-sidebar/doctor-fee-sidebar.component";

@Component({
  selector: 'app-doctor-fee-layout',
  imports: [RouterOutlet, DoctorFeeSidebarComponent],
  templateUrl: './doctor-fee-layout.component.html',
  styleUrl: './doctor-fee-layout.component.css'
})
export class DoctorFeeLayoutComponent {

}
