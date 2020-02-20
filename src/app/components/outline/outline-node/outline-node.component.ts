import {
  Component,
  OnInit,
  Input,
  ChangeDetectionStrategy,
  OnDestroy,
  ChangeDetectorRef,
  NgZone
} from "@angular/core";
import { TreeNode } from "src/app/models/tree-node";
import { Subject } from "rxjs";
import { OutlineService } from "src/app/services/outline.service";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: "app-outline-node",
  templateUrl: "./outline-node.component.html",
  styleUrls: ["./outline-node.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OutlineNodeComponent implements OnInit, OnDestroy {
  private destroyed$ = new Subject();

  node: TreeNode;
  @Input("node") set setNode(node: TreeNode) {
    if (this.node !== node) {
      this.node = node;
      this.cdRef.detectChanges();
    }
  }

  treeControl = this.outlineService.treeConrol;
  constructor(
    private outlineService: OutlineService,
    private cdRef: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    this.cdRef.detach();
    outlineService.selected.pipe(takeUntil(this.destroyed$)).subscribe(data => {
      // Track only changed items:
      if (data && data.changed && data.changed.includes(this.node)) {
        this.cdRef.detectChanges();
      }
    });

    this.outlineService.mouseOver.subscribe(node => {
      if (node === this.node) {
        // TODO: performance: if source != outline node.
        this.cdRef.detectChanges();
      }
    });
  }

  setSelected(event, node: TreeNode) {
    this.ngZone.runOutsideAngular(() =>
      this.outlineService.setSelectedNode(node, event.ctrlKey)
    );
  }

  mouseEnter(node: TreeNode) {
    this.ngZone.runOutsideAngular(() => this.outlineService.setMouseOver(node));
  }

  mouseLeave(node: TreeNode) {
    this.ngZone.runOutsideAngular(() =>
      this.outlineService.setMouseLeave(node)
    );
  }

  ngOnInit(): void {}

  ngOnDestroy() {
    this.destroyed$.next(true);
    this.destroyed$.complete();
    this.destroyed$ = null;
  }
}