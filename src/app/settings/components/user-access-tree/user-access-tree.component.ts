import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../utils/toast/toast.service';

@Component({
  selector: 'app-user-access-tree',
  imports: [FormsModule],
  templateUrl: './user-access-tree.component.html',
  styleUrl: './user-access-tree.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAccessTreeComponent {
  readonly nodes = input<any[]>([]);
  private toast = inject(ToastService);

  ngOnInit(): void {
    this.initializeCollapseState(this.nodes());
  }

  selectAll() {
    this.nodes().forEach(node => {
      node.isSelected = true;
      this.updateChildren(node, true);
    });
    this.toast.success('All Access Selected!', 'bottom-right', 3000);
  }

  deselectAll() {
    this.nodes().forEach(node => {
      node.isSelected = false;
      this.updateChildren(node, false);
    });
    this.toast.warning('All Access deselected!', 'bottom-right', 3000);
  }

  onCheck(node: any, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    node.isSelected = checked;
    this.updateChildren(node, checked);
  }

  private updateChildren(node: any, checked: boolean) {
    if (node.children) {
      node.children.forEach((child: any) => {
        child.isSelected = checked;
        this.updateChildren(child, checked);
      });
    }
    if (node.permissionsKey) {
      node.permissionsKey.forEach((permission: any) => {
        permission.isSelected = checked;
      });
    }
  }

  onPermissionCheck(node: any) {
    node.isSelected = node.permissionsKey.some((p: any) => p.isSelected);
  }

  toggleCollapse(node: any) {
    node.collapsed = !node.collapsed;
  }

  private initializeCollapseState(nodes: any[]) {
    nodes.forEach((node) => {
      if (!('collapsed' in node)) {
        node.collapsed = true;
      }
      if (node.children) {
        this.initializeCollapseState(node.children);
      }
    });
  }
}
