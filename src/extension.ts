import * as vscode from 'vscode';
import { translate, resourceLoadSuccess, loadTranslateResource } from './translate';

function isDef<T>(val: T): val is NonNullable<T> {
  return val !== undefined && val !== null;
}

async function updateDecorations(editor: vscode.TextEditor | undefined) {
  if (!editor) { return; }
  
  const document = editor?.document;
  if (!document) { return; }
  // vscode 读取安装目录的文件
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) { return; }
  const config = vscode.workspace.getConfiguration();
  const resourcePath: string | undefined = config.get('i18n-reverse.resourcePath');
  if (!resourcePath) { return; }

  const resolvedPath = vscode.Uri.joinPath(workspaceFolder.uri, resourcePath);

  if (!resourceLoadSuccess) {
    try {
      const resource = (await vscode.workspace.fs.readFile(resolvedPath)).toString();
      const firstLeftBraceIndex = resource.indexOf('{');
      const res = resource.slice(firstLeftBraceIndex);
      const resourceObj = eval(`(${res})`);
      loadTranslateResource(resourceObj);
    } catch(err: any) {
      vscode.window.showErrorMessage(err.message);
      return;
    }
  }
  const decorationType = vscode.window.createTextEditorDecorationType({
    textDecoration: 'none; display: none;', // display: none 用于隐藏掉原本的文字
  });
  const decorationOptions: vscode.DecorationOptions[] = [];

  for (let i = 0; i < document.lineCount; i++) {
    const res = getRangeText(document.lineAt(i));
    if (!res) {continue;}
    const { range, translateResult, matchedStr } = res;
    decorationOptions.push({
      range,
      hoverMessage: matchedStr,
      renderOptions: {
        after: {
          contentText: translateResult,
          color: 'yellow',
          border: '1px solid gray',
        }
      }
    });
  }
  // 设置装饰后, 刷新编辑器
  editor.setDecorations(decorationType, decorationOptions);
}

export function activate() {
  console.log('插件激活');
  vscode.window.onDidChangeActiveTextEditor(updateDecorations);

  const editor = vscode.window.activeTextEditor;
  updateDecorations(editor);
}

function getRangeText(line: vscode.TextLine): {range: vscode.Range; translateResult: string; matchedStr: string} | null {
  const regex = /\$t\(['"]([^'"]+)['"]\)/;
  const text = line.text;
  const matcher = text.match(regex);
  const index = matcher?.index;
  if (isDef(index) && matcher )  {
    const [result] = matcher;
    const translateResult = translate(matcher[1]);
    const start = index;
    const end = start + result.length;
    const range = new vscode.Range(line.lineNumber, start, line.lineNumber, end);

    return {
      range,
      translateResult,
      matchedStr: matcher[1]
    };
  }
  return null;
}

export function deactivate() {}
