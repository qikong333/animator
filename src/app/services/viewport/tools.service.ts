import { Injectable } from "@angular/core";
import { PanTool } from "./pan.tool";
import { MouseEventArgs } from "../../models/mouse-event-args";
import { BaseTool } from "./base.tool";
import { ZoomTool } from "./zoom.tool";
import { BehaviorSubject, Subject } from "rxjs";
import { SelectionTool } from "./selection.tool";
import { ScrollbarsPanTool } from "./scrollbars-pan.tool";
import { Utils } from "../utils/utils";
import { OutlineService } from "../outline.service";
import { ViewService } from "../view.service";
import { consts } from "src/environments/consts";
import { SelectionService } from "../selection.service";
import { PathTool } from "./path.tool";
import { PathDirectSelectionTool } from "./path-direct-selection.tool";
import { ShapeTool } from "./shape.tool";

/**
 * Handle current active tool and services.
 */
@Injectable({
  providedIn: "root",
})
export class ToolsService {
  activeToolSubject = new BehaviorSubject<BaseTool>(null);
  viewportMouseMoveSubject = new Subject<MouseEventArgs>();
  public tools: Array<BaseTool> = [];
  private activeTool: BaseTool = null;

  constructor(
    private panTool: PanTool,
    private zoomTool: ZoomTool,
    selectionTool: SelectionTool,
    pathTool: PathDirectSelectionTool,
    createPathTool: PathTool,
    private selectionService: SelectionService,
    private viewService: ViewService,
    private shapeTool: ShapeTool,
    // Special tool to control pan by scrollbars
    private scrollbarsPanTool: ScrollbarsPanTool
  ) {
    this.tools.push(selectionTool);
    this.tools.push(pathTool);
    this.tools.push(panTool);
    this.tools.push(zoomTool);
    this.tools.push(createPathTool);
    this.tools.push(shapeTool);
    this.setActiveTool(panTool);
  }

  getActiveTool(): BaseTool {
    return this.activeTool;
  }

  activeToolChanged() {
    return this.activeToolSubject.asObservable();
  }

  setActiveTool(tool: BaseTool) {
    if (this.activeTool !== tool) {
      if (this.activeTool) {
        this.activeTool.onDeactivate();
      }
      this.activeTool = tool;
      if (this.activeTool) {
        this.activeTool.onActivate();
      }
      this.activeToolSubject.next(this.activeTool);
    }
  }

  onViewportTouchStart(event: TouchEvent) {
    this.activeTool.onViewportMouseDown(new MouseEventArgs(event));
  }
  onViewportTouchEnd(event: TouchEvent) {
    this.activeTool.onViewportMouseUp(new MouseEventArgs(event));
  }
  onViewportMouseMove(event: TouchEvent | MouseEvent) {
    const args = new MouseEventArgs(event);
    if (args.screenPoint) {
      args.viewportPoint = Utils.toElementPoint(
        this.viewService,
        args.screenPoint
      );
    }
    this.activeTool.onViewportMouseMove(args);
    this.viewportMouseMoveSubject.next(args);
  }
  onViewportTouchLeave(event: TouchEvent) {
    this.activeTool.onViewportMouseLeave(new MouseEventArgs(event));
  }
  onViewportContextMenu(event: MouseEvent) {
    this.activeTool.onViewportContextMenu(new MouseEventArgs(event));
  }
  onViewportTouchCancel(event: TouchEvent) {
    this.activeTool.onViewportMouseUp(new MouseEventArgs(event));
  }
  onViewportMouseLeave(event: MouseEvent) {
    this.activeTool.onViewportMouseLeave(new MouseEventArgs(event));
  }
  onViewportMouseDown(event: MouseEvent) {
    this.activeTool.onViewportMouseDown(new MouseEventArgs(event));
  }
  onViewportMouseUp(event: MouseEvent) {
    this.activeTool.onViewportMouseUp(new MouseEventArgs(event));
  }
  onViewportMouseWheel(event: WheelEvent) {
    const mouseArgs = new MouseEventArgs(event);
    this.activeTool.onViewportMouseWheel(mouseArgs);

    if (!mouseArgs.handled) {
      if (event.ctrlKey) {
        // Allow to zoom by mouse wheel for all the modes
        if (this.activeTool !== this.zoomTool) {
          this.zoomTool.onViewportMouseWheel(mouseArgs);
        }
      } else {
        this.scrollbarsPanTool.onViewportMouseWheel(mouseArgs);
      }
    }
  }

  onViewportBlur(event: Event) {
    this.activeTool.onViewportBlur(event);
  }

  onPlayerMouseOut(event: MouseEvent) {
    this.activeTool.onPlayerMouseOut(new MouseEventArgs(event));
  }

  onPlayerMouseOver(event: MouseEvent) {
    this.activeTool.onPlayerMouseOver(new MouseEventArgs(event));
  }

  onWindowMouseLeave(event: MouseEvent) {
    this.activeTool.onWindowMouseLeave(new MouseEventArgs(event));
  }
  onWindowKeyDown(event: KeyboardEvent) {
    this.activeTool.onWindowKeyDown(event);
  }
  onWindowKeyUp(event: KeyboardEvent) {
    this.activeTool.onWindowKeyUp(event);
  }
  onWindowMouseDown(event: MouseEvent) {
    this.activeTool.onWindowMouseDown(new MouseEventArgs(event));
  }
  onWindowMouseMove(event: MouseEvent) {
    const args = new MouseEventArgs(event);
    if (args.screenPoint) {
      args.viewportPoint = Utils.toElementPoint(
        this.viewService,
        args.screenPoint
      );
    }
    this.activeTool.onWindowMouseMove(args);
  }
  onWindowMouseUp(event: MouseEvent) {
    this.activeTool.onWindowMouseUp(new MouseEventArgs(event));
  }
  onWindowMouseWheel(event: WheelEvent) {
    this.activeTool.onWindowMouseWheel(new MouseEventArgs(event));
  }

  onWindowBlur(event: Event) {
    this.activeTool.onWindowBlur(event);
  }

  getPan() {}
  fitViewportToSelected() {
    const selectedItems = this.selectionService.getSelectedElements();
    let bounds = Utils.getBoundingClientRect(...selectedItems);
    if (bounds) {
      bounds = Utils.matrixRectTransform(
        bounds,
        this.viewService.getScreenCTM().inverse()
      );
      bounds = Utils.shrinkRect(bounds, consts.fitToSelectedExtraBounds);
      this.fitViewport(bounds);
    }
  }

  /**
   * Fit zoom and pan.
   */
  fitViewport(rect: DOMRect = null) {
    this.zoomTool.fit(rect);
    this.panTool.fit(rect);
  }
}
