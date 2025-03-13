import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SettingsSidebarComponent } from "../../settings/components/settings-sidebar/settings-sidebar.component";

@Component({
  selector: 'app-settings-layout',
  imports: [RouterOutlet, SettingsSidebarComponent],
  templateUrl: './settings-layout.component.html',
  styleUrl: './settings-layout.component.css'
})
export class SettingsLayoutComponent {

}
