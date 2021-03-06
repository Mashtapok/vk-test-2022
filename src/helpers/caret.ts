import { getTextContent } from "./highlight";

// Сохраняет позицию курсора
export const saveCaretPosition = (input: HTMLDivElement) => {
  const range = window.getSelection()!.getRangeAt(0);
  const preCaretRange = range.cloneRange();

  preCaretRange.selectNodeContents(input);
  preCaretRange.setEnd(range.endContainer, range.endOffset);

  const nodes = Array.from(preCaretRange.cloneContents().childNodes);

  return nodes.map(getTextContent).join("").length;
};

const getCaretNodeAndOffset = (input: HTMLDivElement, caretPosition: number) => {
  const nodes = Array.from(input.childNodes);
  let spanLength = 0;

  for (const node of nodes) {
    const textLength = getTextContent(node).length;

    if (spanLength + textLength >= caretPosition) {
      return [node, caretPosition - spanLength];
    }

    spanLength += textLength;
  }
  return [];
};

// Устанавливает сохраненное положение курсора
export const restoreCaretPosition = (input: HTMLDivElement, caretPosition: number) => {
  const [node, offset]: any = getCaretNodeAndOffset(input, caretPosition);

  if (node) {
    const range = window.getSelection()!.getRangeAt(0);

    if (node.nodeName === "IMG") {
      range.setStartAfter(node);
    } else if (node.nodeType === Node.TEXT_NODE) {
      range.setStart(node, offset);
    } else {
      if (node.childNodes[0].nodeName === "BR") {
        range.setStart(node.childNodes[0], 0);
      }
      range.setStart(node.childNodes[0], offset);
    }

    range.collapse(true);
  }
};
