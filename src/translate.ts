import {init, t} from 'i18next';
import {window} from 'vscode';
export let resourceLoadSuccess = false;

export function translate(text: string): string {
  return t(text);
}


export function loadTranslateResource(resource: any, lang: string = 'zh') {
  if (resourceLoadSuccess) {
    return;
  }

  init({
    lng: lang,
    resources: {
      [lang]: {
        translation: resource
      }
    }
  });

  resourceLoadSuccess = true;
  
  window.showInformationMessage('i18n-reverse initial successful!');
}