import { BaseTool } from "./base.tool";
import { MouseEventArgs } from "./MouseEventArgs";
import { Injectable } from "@angular/core";
import { LoggerService } from "../logger.service";
import { ViewportService } from "./viewport.service";
import { BaseSelectionTool } from "./base-selection.tool";
import { PanTool } from "./pan.tool";
import { consts } from "src/environments/consts";

@Injectable({
  providedIn: "root"
})
export class ZoomTool extends BaseSelectionTool {
  viewport: SVGElement = null;
  iconName = "search";
  constructor(
    viewportService: ViewportService,
    logger: LoggerService,
    panTool: PanTool
  ) {
    super(viewportService, logger, panTool);
  }

  onViewportMouseWheel(event: MouseEventArgs) {
    if (!this.viewportService.isInit()) {
      return;
    }
    event.preventDefault();
    event.handled = true;
    const direction = event.deltaY;
    this.zoom(direction, consts.zoom.sensitivityWheel, event);
  }
  /**
   * Override base method.
   */
  selectionEnded(event: MouseEventArgs, selectedArea: DOMRect) {
    const clickThreshold = 8;
    if (
      selectedArea &&
      selectedArea.width > clickThreshold &&
      selectedArea.height > clickThreshold
    ) {
      // Zoom to area when selection is made:
      this.fit(selectedArea);
      this.panTool.fit(selectedArea);
    } else {
      // check the bounds while it's window events:
      const area = this.viewportService.getContainerClientRect();
      if (
        event.clientX >= area.left &&
        event.clientX <= area.right &&
        event.clientY >= area.top &&
        event.clientY <= area.bottom
      ) {
        this.zoomByMouseEvent(event);
      }
    }
  }

  zoomByMouseEvent(event: MouseEventArgs) {
    if (!this.viewportService.isInit()) {
      return;
    }

    let direction = -1;
    const e = event.args as MouseEvent;
    if (e.shiftKey || e.ctrlKey || e.button === 2) {
      direction = 1;
    }

    this.zoom(direction, consts.zoom.sensitivityMouse, event);
  }

  zoom(direction = 1, scale = 1, event: MouseEventArgs = null) {
    scale = 1 - direction * scale;
    if (scale !== 0) {
      let matrix = this.viewportService.getCTM();
      let point = new DOMPoint(1, 1, 1, 1);
      if (event) {
        point = this.viewportService
          .toSvgPoint(event.clientX, event.clientY)
          .matrixTransform(matrix.inverse());
      }

      const expectedScale = matrix.a * scale;
      if (
        expectedScale >= consts.zoom.min &&
        expectedScale <= consts.zoom.max
      ) {
        matrix = matrix
          .translate(point.x, point.y)
          .scale(scale, scale, scale)
          .translate(-point.x, -point.y);
        this.viewportService.setCTM(matrix);
      }
    }
  }
  setDirectZoom(scale: number) {
    const matrix = this.viewportService.getCTM();
    matrix.a = scale;
    matrix.d = scale;
    this.viewportService.setCTM(matrix);
  }

  fit(rect: DOMRect = null) {
    if (!this.viewportService.isInit()) {
      return;
    }

    if (!rect) {
      rect = this.viewportService.getWorkAreaSize();
    }

    const parentSize = this.viewportService.getContainerSize();

    let fitProportion = Math.min(
      parentSize.width / rect.width,
      parentSize.height / rect.height,
      consts.zoom.max
    );

    fitProportion = Math.max(fitProportion, consts.zoom.min);

    this.setDirectZoom(fitProportion);
  }
}
