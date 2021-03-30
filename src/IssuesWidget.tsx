
import * as React from "react";
import { I18N } from "@bentley/imodeljs-i18n";
import { AbstractWidgetProps, StagePanelLocation, StagePanelSection, UiItemsProvider } from "@bentley/ui-abstract";
import { Button, ButtonSize, ButtonType, CommonProps } from "@bentley/ui-core";
import { useState } from "react";
import { getCenteredViewRect, imageBufferToBase64EncodedPng, IModelApp, Viewport } from "@bentley/imodeljs-frontend";
import { AttachmentMetadataCreate, ErrorResponse, HttpResponse, IssuesApi, IssuesList, IssueSummary, RequestParams } from "./clients/IssuesClient"
import { Point2d } from "@bentley/geometry-core";
import { ImageBuffer } from "@bentley/imodeljs-common";

/**
 * The provider that will be registered
 */
export class IssuesProvider implements UiItemsProvider {
    public readonly id = "1898UiProvider";
    public static i18n: I18N;
    private readonly contextId: string;
    private issuesClient: IssuesApi<undefined>;

    public constructor(contextId: string) {
        this.contextId = contextId;
        this.issuesClient = new IssuesApi();
    }

    public provideWidgets(stageId: string, _stageUsage: string, location: StagePanelLocation, _section?: StagePanelSection | undefined): ReadonlyArray<AbstractWidgetProps> {
        const widgets: AbstractWidgetProps[] = [];
        if (stageId === "DefaultFrontstage" && location === StagePanelLocation.Right) {
            widgets.push({
                id: "issuesWidget",
                getWidgetContent: () => <IssuesWidget projectId={this.contextId} issuesClient={this.issuesClient} />,
                label: "Issues",
            });
        }
        return widgets;
    }
}

interface IssuesWidgetProps extends CommonProps {
    projectId: string;
    issuesClient: IssuesApi<undefined>;
}

/**
 * A react function component that will render the widget.
 * This widget currently lists all available issues an a table and provides a button to upload
 * a screenshot of the view to the issue.
 * @param props
 * @returns 
 */
const IssuesWidget: React.FC<IssuesWidgetProps> = (props: IssuesWidgetProps) => {
    const [issuesList, setIssues] = useState<IssuesList>({ issues: [] });

    React.useEffect(() => {
        const fetchData = async () => {
            if (issuesList.issues && issuesList.issues.length === 0) {
                let issuesResp = await props.issuesClient.getProjectIssues({ projectId: props.projectId })
                setIssues(issuesResp.data);
            }
        }
        fetchData();
    });

    /**
     * Creates an attachment on the selected widget and uploads a screenshot of the viewport to the created attachment.
     * In practice, MarkupApp would be started, run, and the result of MarkupApp.stop() is what would be uploaded.
     * @param e 
     */
    const uploadScreenshot = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        const id = e.currentTarget.id;
        const params: AttachmentMetadataCreate & RequestParams = {
            fileName: "DesignReview_Markup.png", // This needs to be the name of the file for DesignReview to list it in its issues pane
            caption: "From markup example app.",
        }

        // Create attachment and get attachmentId 
        const resp: HttpResponse<void, ErrorResponse | void> = await props.issuesClient.id.addAttachmentToIssue(id, params);

        // Get attachmentId from response.headers.location
        const uploadURL: string | null = resp.headers.get("location");
        const match: RegExpMatchArray | null = uploadURL!.match(/\/attachments\/(.*)/);
        if (match && match.length >= 2) {
            // Get screenshot
            const viewPort: Viewport = IModelApp.viewManager.selectedView!;
            const img: ImageBuffer | undefined = viewPort.readImage(getCenteredViewRect(viewPort.viewRect), new Point2d(846, 600), true);
            if (img) {
                const thumbnail = imageBufferToBase64EncodedPng(img);
                const image: string = `data:image/png;base64,${thumbnail}`;
                const attachmentId: string = match[1];

                // Upload the base64EncodedPng to Issue and Attachment Id
                await props.issuesClient.id.uploadAttachmentFile(id, attachmentId, image);
            }
        }
    }

    return (
        <div>
            <div>
                <table>
                    <tbody>
                        <tr>
                            <th>{IModelApp.i18n.translate("IssuesWidget.DisplayName")}</th>
                            <th>{IModelApp.i18n.translate("IssuesWidget.Type")}</th>
                            <th>{IModelApp.i18n.translate("IssuesWidget.State")}</th>
                        </tr>
                        {issuesList && issuesList.issues && issuesList.issues.length > 0 && issuesList.issues.map((i: IssueSummary) => {

                            return (
                                <tr>
                                    <td>{i.displayName}</td>
                                    <td>{i.type}</td>
                                    <td>{i.state}</td>
                                    <Button id={i.id} buttonType={ButtonType.Blue} size={ButtonSize.Default} onClick={uploadScreenshot}>Upload Markup</Button>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
