import { injectable } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution } from '@theia/core/lib/browser/frontend-application-contribution';
import { MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';

/**
 * Patch MonacoEditor to keep model attached when hidden.
 * This fixes decoration and state issues when switching between webview and editor tabs.
 */
@injectable()
export class FixMonacoEditorPatch implements FrontendApplicationContribution {

    onStart(): void {
        this.patchMonacoEditorVisibilityHandling();
    }

    protected patchMonacoEditorVisibilityHandling(): void {
        MonacoEditor.prototype.handleVisibilityChanged = function (this: MonacoEditor, nowVisible: boolean): void {
            if (nowVisible) {
                if ((this as any).model) {
                    (this as any).editor.setModel((this as any).model);
                    (this as any).editor.restoreViewState((this as any).savedViewState);
                    (this as any).editor.focus();
                }
            } else {
                (this as any).model = (this as any).editor.getModel();
                (this as any).savedViewState = (this as any).editor.saveViewState();
                // Keep model attached instead of setting to null
                (this as any).editor.setModel((this as any).model);
            }
        };

        console.log('[FixMonacoEditorPatch] Patched MonacoEditor.handleVisibilityChanged to preserve model when hidden');
    }
}
