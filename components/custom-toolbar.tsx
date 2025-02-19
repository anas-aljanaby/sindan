import React from "react";
import {
  FormattingToolbar,
  BlockTypeSelect,
  BasicTextStyleButton,
  TextAlignButton,
  ColorStyleButton,
  NestBlockButton,
  UnnestBlockButton,
  CreateLinkButton,
  FileCaptionButton,
  FileReplaceButton,
  useComponentsContext,
} from "@blocknote/react";
import "@blocknote/mantine/style.css";
import { BlockNoteEditor } from "@blocknote/core";

interface CustomToolbarProps {
  editor: BlockNoteEditor;
  openHighlightPrompt: (position: { top: number; left: number }) => void;
  setSelectedBlockId: (id: string) => void;
  setSelectedText: (text: string) => void;
}

const CustomToolbar: React.FC<CustomToolbarProps> = ({
  editor,
  openHighlightPrompt,
  setSelectedBlockId,
  setSelectedText,
}) => {
  const Components = useComponentsContext()!;

  const onClickPromptButton = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim() !== "") {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const position = {
        top: rect.top + window.scrollY + rect.height + 30,
        left: rect.left + window.scrollX,
      };

      const selectedBlock = editor.getTextCursorPosition().block;
      console.log("detected block id", selectedBlock.id);
      setSelectedBlockId(selectedBlock.id);

      // Save the selected text
      setSelectedText(editor.getSelectedText());

      editor.addStyles({ backgroundColor: "blue" });

      openHighlightPrompt(position);
    }
  };

  return (
    <FormattingToolbar>
      <BlockTypeSelect key={"blockTypeSelect"} />
      <Components.FormattingToolbar.Button
        mainTooltip="Edit text with AI"
        onClick={onClickPromptButton}
      >
        AI Edit
      </Components.FormattingToolbar.Button>
      <FileCaptionButton key={"fileCaptionButton"} />
      <FileReplaceButton key={"replaceFileButton"} />
      <BasicTextStyleButton basicTextStyle={"bold"} key={"boldStyleButton"} />
      <BasicTextStyleButton basicTextStyle={"italic"} key={"italicStyleButton"} />
      <BasicTextStyleButton basicTextStyle={"underline"} key={"underlineStyleButton"} />
      <BasicTextStyleButton basicTextStyle={"strike"} key={"strikeStyleButton"} />
      <BasicTextStyleButton key={"codeStyleButton"} basicTextStyle={"code"} />
      <TextAlignButton textAlignment={"left"} key={"textAlignLeftButton"} />
      <TextAlignButton textAlignment={"center"} key={"textAlignCenterButton"} />
      <TextAlignButton textAlignment={"right"} key={"textAlignRightButton"} />
      <ColorStyleButton key={"colorStyleButton"} />
      <NestBlockButton key={"nestBlockButton"} />
      <UnnestBlockButton key={"unnestBlockButton"} />
      <CreateLinkButton key={"createLinkButton"} />
    </FormattingToolbar>
  );
};

export default CustomToolbar;
