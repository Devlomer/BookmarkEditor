import { BookmarkNode } from '../types/bookmark';

export function exportBookmarkHTML(root: BookmarkNode): string {
  const lines: string[] = [];

  lines.push('<!DOCTYPE NETSCAPE-Bookmark-file-1>');
  lines.push('<!-- This is an automatically generated file.');
  lines.push('     It will be read and overwritten.');
  lines.push('     DO NOT EDIT! -->');
  lines.push('<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">');
  lines.push(`<TITLE>${escapeHtml(root.title)}</TITLE>`);
  lines.push(`<H1>${escapeHtml(root.title)}</H1>`);
  lines.push('');
  lines.push('<DL><p>');

  if (root.children) {
    for (const child of root.children) {
      renderNode(child, lines, 1);
    }
  }

  lines.push('</DL><p>');

  return lines.join('\n');
}

function renderNode(node: BookmarkNode, lines: string[], depth: number): void {
  const indent = '    '.repeat(depth);

  if (node.type === 'separator') {
    lines.push(`${indent}<HR>`);
    return;
  }

  if (node.type === 'folder') {
    let attrs = '';
    if (node.addDate) {
      attrs += ` ADD_DATE="${node.addDate}"`;
    }
    if (node.lastModified) {
      attrs += ` LAST_MODIFIED="${node.lastModified}"`;
    }
    lines.push(`${indent}<DT><H3${attrs}>${escapeHtml(node.title)}</H3>`);
    lines.push(`${indent}<DL><p>`);

    if (node.children) {
      for (const child of node.children) {
        renderNode(child, lines, depth + 1);
      }
    }

    lines.push(`${indent}</DL><p>`);
    return;
  }

  if (node.type === 'link') {
    let attrs = '';
    if (node.url) {
      attrs += ` HREF="${escapeHtml(node.url)}"`;
    }
    if (node.addDate) {
      attrs += ` ADD_DATE="${node.addDate}"`;
    }
    if (node.icon) {
      attrs += ` ICON="${node.icon}"`;
    }
    lines.push(`${indent}<DT><A${attrs}>${escapeHtml(node.title)}</A>`);
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
