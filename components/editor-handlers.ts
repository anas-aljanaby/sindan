import { BlockIdentifier, BlockNoteEditor, fileBlockConfig, InlineContent, PartialBlock } from "@blocknote/core";
import { EdgeStore } from "@/lib/edgestore";
import { extractTextFromBlock } from './editor-utils';
    
export const handleUpload = async (edgestore: EdgeStore) => {
  return async (file: File) => {
    const res = await edgestore.publicFiles.upload({
      file,
    });
    return res.url;
  };
};

async function getCompletion(text: string, context: string = ""): Promise<string> {
  try {
    const response = await fetch('/api/llm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, context }),
    });

    if (!response.ok) {
      throw new Error('Failed to get completion');
    }

    const data = await response.json();
    return data.completion;
  } catch (error) {
    console.error('Error getting completion:', error);
    throw error;
  }
}

export const handleHighlightedText = async (
  editor: BlockNoteEditor,
  selectedBlockId: BlockIdentifier | null,
  selectedText: string,
  userInput: string,
) => {
  if (!selectedBlockId) return;

  // Get the full document content
  //TODO: find a more efficient way to do this
  let fullContent = '';
  editor.forEachBlock((block) => {
    fullContent += block.content.map(inline => inline.text).join(' ') + '\n';
  });

  // Prepare the prompt
  const prompt = `Here is the full document content:

  ${fullContent}
  
  The following text is highlighted: "${selectedText}"
  
  ${userInput ? `Apply these instructions to the highlighted text only: ${userInput}` : 'Provide a synonym or brief rephrase for the highlighted text only, without returning any non highlighted text.'}
  
  The replacement should fit naturally in place of the highlighted text, maintaining the original sentence structure and context. Do not introduce new ideas or sentences.`;
  

  console.log("prompt\n", prompt);
  try {
    // Call your AI service here with the prompt
    const response = await getCompletion(prompt);

    editor.updateBlock(selectedBlockId, {
      content: editor.getBlock(selectedBlockId)!.content.map(inline => {
        if (inline.type === 'text' && inline.text === selectedText) {
          return {
            ...inline,
            text: response,
            styles: { ...inline.styles, backgroundColor: 'default' }
          };
        }
        if (inline.type === 'text' && inline.styles && inline.styles.backgroundColor === 'blue') {
          return {
            ...inline,
            text: inline.text.replace(selectedText, response),
            styles: { ...inline.styles, backgroundColor: 'default' }
          };
        }
        return inline;
      }),
    });
  } catch (error) {
    console.error('Error in handleHighlightedText:', error);
  }
};

export async function handleContinueWriting(
  editor: BlockNoteEditor,
  currentBlock: PartialBlock,
  userInput: string,
  context: string
) {
  if (!currentBlock) return;
  const extractedText = extractTextFromBlock(currentBlock);
  const combinedText = `Finish the following text, by applying the insturctions.
If there are no instructions just continue based on the text.
Instructions: 
${userInput}
Text:
${extractedText}`;

  console.log('combinedText:', combinedText);
  try {
    const completion = await getCompletion(combinedText, context);
    const aiSuggestion: InlineContent<any, any> = {
      type: "text",
      text: completion,
      styles: {
        textColor: "#[1F1F1F]",
      },
    };

    const currentContent = currentBlock.content as InlineContent<any, any>[];
    const updatedContent = [...currentContent, aiSuggestion];

    editor.updateBlock(currentBlock, {
      content: updatedContent,
    });

    editor.setTextCursorPosition(currentBlock, "end");
  } catch (error) {
    // Error handling is done in getCompletion function
  }
}

export async function handleContinueWritingWrapper(
  editor: BlockNoteEditor,
  currentBlock: PartialBlock | null,
  userInput: string,
  context: string,
  setShowTextWindow: (value: boolean) => void,
  setUserInput: (value: string) => void
) {
  if (currentBlock) {
    await handleContinueWriting(editor, currentBlock, userInput, context);
    setShowTextWindow(false);
    setUserInput("");
  }
}

export function handleEditorChange(editor: BlockNoteEditor, onChange: (value: string) => void) {
  onChange(JSON.stringify(editor.document, null, 2));
}

export function handleSelection(
  setSavedSelection: (range: Range) => void,
  setHighlightPosition: (position: { top: number; left: number }) => void,
  setShowHighlightWindow: (value: boolean) => void
) {
  const selection = window.getSelection();
  
  if (selection && selection.toString().trim() !== "") {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    setSavedSelection(range);
    setHighlightPosition({
      top: rect.top + window.scrollY + rect.height + 30, // Position below the selected text
      left: rect.left + window.scrollX,
    });
    setShowHighlightWindow(true);
  }
}
