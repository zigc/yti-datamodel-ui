import { upperCaseFirst } from 'change-case';

function normalizeAsId(resourceName: string) {
  return resourceName
    .replace(/\s/g, '')
    .replace(/ö/g, 'o')
    .replace(/Ö/g, 'O')
    .replace(/ä/g, 'a')
    .replace(/Ä/g, 'A')
    .replace(/å/g, 'a')
    .replace(/Å/g, 'A');
}

export function labelNameToResourceIdName(labelName: string) {
  return normalizeAsId(upperCaseFirst(capitalizeEveryWord(labelName)));
}

export function capitalizeEveryWord(value: string) {
  return value.split(' ').map(val => val.charAt(0).toUpperCase() + val.slice(1)).join(' ');
}

