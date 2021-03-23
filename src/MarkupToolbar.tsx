import { IModelApp, ScreenViewport } from "@bentley/imodeljs-frontend";
import { LineTool, MarkupApp, SelectTool } from "@bentley/imodeljs-markup";
import { CommonToolbarItem, ToolbarItemUtilities, UiItemsProvider } from "@bentley/ui-abstract";
import { StageUsage, ToolbarUsage, ToolbarOrientation } from "@bentley/ui-abstract";

export class MarkupToolbarProvider implements UiItemsProvider {
  public readonly id = "MyItemsProvider";

  public provideToolbarButtonItems(_stageId: string, stageUsage: string, toolbarUsage: ToolbarUsage, toolbarOrientation: ToolbarOrientation): CommonToolbarItem[] {
    if (stageUsage !== StageUsage.General ||
      toolbarUsage !== ToolbarUsage.ContentManipulation ||
      toolbarOrientation !== ToolbarOrientation.Vertical)
      return [];

    return [
      ToolbarItemUtilities.createActionButton(
        "myextension-markup-select",
        200,
        "icon-cursor",
        SelectTool.flyover,
        () => {
          MarkupApp.start(
            IModelApp.viewManager.selectedView as ScreenViewport
          ).then(() => {
            IModelApp.tools.run(SelectTool.toolId);
          });
        }
      ),
      ToolbarItemUtilities.createActionButton(
        "myextension-markup-line",
        201,
        LineTool.iconSpec,
        LineTool.flyover,
        () => {
          MarkupApp.start(
            IModelApp.viewManager.selectedView as ScreenViewport
          ).then(() => {
            IModelApp.tools.run(LineTool.toolId);
          });
        }
      ),
      ToolbarItemUtilities.createActionButton(
        "myextension-markup-stop",
        202,
        "icon-remove",
        "Stop Markup",
        () => {
          if (MarkupApp.isActive) {
            MarkupApp.stop();
          }
        }
      ),
    ];
  }
}

