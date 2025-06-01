import { Component, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { AccountingReportsService } from '../../../services/accounting-reports.service';
import { DataFetchService } from '../../../../shared/services/useDataFetch';
import { AuthService } from '../../../../settings/services/auth.service';

@Component({
  selector: 'app-general-cash-book',
  imports: [],
  templateUrl: './general-cash-book.component.html',
  styleUrl: './general-cash-book.component.css'
})
export class GeneralCashBookComponent {
  private accountingReportsService = inject(AccountingReportsService);
  private dataFetchService = inject(DataFetchService);
  private authService = inject(AuthService);
  isView = signal<boolean>(false);
  filteredReports = signal<any[]>([]);
  fromDate = signal<any>(null);
  toDate = signal<any>(null);

  isLoading$: Observable<any> | undefined;
  hasError$: Observable<any> | undefined;
  marginTop: any = 0;

  ngOnInit() {
    const today = new Date();
    this.fromDate.set(today.toISOString().split('T')[0]);
    this.onLoadReport();
    this.isView.set(this.checkPermission("General CashBook", "View"));
  }

  onLoadReport() {
    const reqData = {
      "bankCashChartofAccountId": null,
      "fromDate": this.fromDate(),
      "toDate": this.toDate() || this.fromDate()
    }
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.accountingReportsService.generalCashBookApi(reqData));

    data$.subscribe(data => {
      this.filteredReports.set(data);
    });

    this.isLoading$ = isLoading$;
    this.hasError$ = hasError$;
  }


  checkPermission(moduleName: string, permission: string) {
    const modulePermission = this.authService.getUser()?.userMenu?.find((module: any) => module?.menuName?.toLowerCase() === moduleName.toLowerCase());
    if (modulePermission) {
      const permissionValue = modulePermission.permissions.find((perm: any) => perm.toLowerCase() === permission.toLowerCase());
      if (permissionValue) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

}
