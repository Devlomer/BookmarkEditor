import { BookmarkNode } from '../types/bookmark';

let idCounter = 0;

function generateId(): string {
  return `bm_${Date.now()}_${idCounter++}`;
}

export function resetIdCounter(): void {
  idCounter = 0;
}

export function parseBookmarkHTML(html: string): BookmarkNode {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const root: BookmarkNode = {
    id: generateId(),
    type: 'folder',
    title: 'Bookmarks',
    children: [],
  };

  // Find the first DL element (the root list)
  const rootDL = doc.querySelector('DL, dl');
  if (!rootDL) {
    return root;
  }

  // Check if there's an H1 title
  const h1 = doc.querySelector('H1, h1');
  if (h1) {
    root.title = h1.textContent?.trim() || 'Bookmarks';
  }

  root.children = parseDL(rootDL);
  return root;
}

function parseDL(dl: Element): BookmarkNode[] {
  const items: BookmarkNode[] = [];
  const children = Array.from(dl.children);

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const tagName = child.tagName.toUpperCase();

    if (tagName === 'DT') {
      const node = parseDT(child, children, i);
      if (node) {
        items.push(node);
      }
    } else if (tagName === 'HR') {
      items.push({
        id: generateId(),
        type: 'separator',
        title: '---',
      });
    }
  }

  return items;
}

function parseDT(dt: Element, siblings: Element[], index: number): BookmarkNode | null {
  // Look for H3 (folder) or A (link) inside this DT
  const h3 = dt.querySelector(':scope > H3, :scope > h3');
  const a = dt.querySelector(':scope > A, :scope > a');

  if (h3) {
    // This is a folder
    const folder: BookmarkNode = {
      id: generateId(),
      type: 'folder',
      title: h3.textContent?.trim() || 'Untitled Folder',
      addDate: parseInt(h3.getAttribute('ADD_DATE') || h3.getAttribute('add_date') || '0') || undefined,
      lastModified: parseInt(h3.getAttribute('LAST_MODIFIED') || h3.getAttribute('last_modified') || '0') || undefined,
      children: [],
    };

    // The DL containing children is either a sibling after this DT or nested inside the DT
    const nestedDL = dt.querySelector(':scope > DL, :scope > dl');
    if (nestedDL) {
      folder.children = parseDL(nestedDL);
    } else {
      // Check next sibling
      const nextSibling = siblings[index + 1];
      if (nextSibling && nextSibling.tagName.toUpperCase() === 'DL') {
        // This doesn't usually happen in standard bookmark format, 
        // but handle it just in case
      }
    }

    // Also look for DL that is a direct next element sibling of DT in the DOM
    let nextEl = dt.nextElementSibling;
    if (nextEl && nextEl.tagName.toUpperCase() === 'DD') {
      nextEl = nextEl.nextElementSibling;
    }
    if (nextEl && nextEl.tagName.toUpperCase() === 'DL' && !nestedDL) {
      folder.children = parseDL(nextEl);
    }

    return folder;
  }

  if (a) {
    // This is a link
    const link: BookmarkNode = {
      id: generateId(),
      type: 'link',
      title: a.textContent?.trim() || 'Untitled',
      url: a.getAttribute('HREF') || a.getAttribute('href') || '',
      addDate: parseInt(a.getAttribute('ADD_DATE') || a.getAttribute('add_date') || '0') || undefined,
      icon: a.getAttribute('ICON') || a.getAttribute('icon') || undefined,
    };
    return link;
  }

  return null;
}

export function generateNewId(): string {
  return generateId();
}
