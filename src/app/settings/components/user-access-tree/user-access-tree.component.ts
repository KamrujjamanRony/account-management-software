import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-access-tree',
  imports: [FormsModule],
  templateUrl: './user-access-tree.component.html',
  styleUrl: './user-access-tree.component.css'
})
export class UserAccessTreeComponent {
  readonly nodes = input<any[]>([]);

  constructor() { }

  ngOnInit(): void {
    this.initializeCollapseState(this.nodes());
  }

  onCheck(node: any, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.updateChildren(node, checked);
  }

  private updateChildren(node: any, checked: boolean) {
    if (node.children) {
      node.children.forEach((child: any) => {
        child.checked = checked;
        this.updateChildren(child, checked);
      });
    }
  }

  toggleCollapse(node: any) {
    node.collapsed = !node.collapsed;
  }

  private initializeCollapseState(nodes: any[]) {
    nodes.forEach((node) => {
      if (!('collapsed' in node)) {
        node.collapsed = true; // Default to collapsed
      }
      if (node.children) {
        this.initializeCollapseState(node.children);
      }
    });
  }

}
