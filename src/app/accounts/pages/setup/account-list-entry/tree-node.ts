import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChevronRight, faChevronDown } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-tree-node',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <li class="node" [class.collapsed]="isCollapsed()[node().id]">
      <div class="flex items-center gap-2 group hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded">
        <span 
          class="toggle-btn cursor-pointer w-5 h-5 flex items-center justify-center"
          (click)="toggleNode.emit({ id: node().id, hasChildren: node().children?.length > 0 })"
        >
          @if (node().children?.length > 0) {
            <fa-icon 
              [icon]="isCollapsed()[node().id] ? faChevronRight : faChevronDown"
              class="text-gray-600 dark:text-gray-400"
            ></fa-icon>
          } @else {
            <span class="w-5 h-5"></span>
          }
        </span>
        
        <span class="flex-1 font-medium">{{ node().subHead }}</span>
        
        <!-- Add button - show for all nodes when insert permission is true -->
        @if (isInsert()) {
          <button
            (click)="addNode.emit(node()); $event.stopPropagation()"
            class="bg-blue-500 hover:bg-blue-600 text-xs py-1 px-3 rounded text-white transition-colors"
            title="Add child account"
          >
            Add
          </button>
        }
        
        <!-- Debug info - remove after fixing -->
        <!-- <span class="text-xs text-gray-400">ID: {{node().id}}</span> -->
      </div>
      
      @if (node().children?.length > 0 && !isCollapsed()[node().id]) {
        <ul class="list-none pl-6 mt-1 border-l-2 border-gray-200 dark:border-gray-700 ml-2">
          @for (child of node().children; track child.id) {
            <app-tree-node
              [node]="child"
              [isCollapsed]="isCollapsed()"
              [isInsert]="isInsert()"
              (toggleNode)="toggleNode.emit($event)"
              (addNode)="addNode.emit($event)"
            />
          }
        </ul>
      }
    </li>
  `,
  styles: [`
    .node.collapsed > ul {
      display: none;
    }
    .node {
      list-style-type: none;
      margin: 4px 0;
    }
  `]
})
export class TreeNodeComponent {
  node = input.required<any>();
  isCollapsed = input.required<{ [key: number]: boolean }>();
  isInsert = input.required<boolean>();
  
  toggleNode = output<{ id: number; hasChildren: boolean }>();
  addNode = output<any>();
  
  faChevronRight = faChevronRight;
  faChevronDown = faChevronDown;
}