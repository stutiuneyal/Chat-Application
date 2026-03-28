import { useEffect, useState } from "react";
import { Button, Tooltip } from "antd";
import {
    PaperClipOutlined,
    BoldOutlined,
    ItalicOutlined,
    UnderlineOutlined,
    LinkOutlined,
    OrderedListOutlined,
    UnorderedListOutlined,
    SmileOutlined,
} from "@ant-design/icons";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
    $getSelection,
    $isRangeSelection,
    FORMAT_TEXT_COMMAND,
    SELECTION_CHANGE_COMMAND,
    COMMAND_PRIORITY_LOW,
} from "lexical";
import {
    INSERT_UNORDERED_LIST_COMMAND,
    INSERT_ORDERED_LIST_COMMAND,
} from "@lexical/list";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🎉", "🔥", "🙏"];

function normalizeUrl(url) {
    const value = String(url || "").trim();
    if (!value) return "";
    if (/^(https?:\/\/|mailto:|tel:)/i.test(value)) return value;
    return `https://${value}`;
}

export default function ToolbarPlugin({ onUploadClick, disabled = false }) {
    const [editor] = useLexicalComposerContext();
    const [formats, setFormats] = useState({
        bold: false,
        italic: false,
        underline: false,
    });

    useEffect(() => {
        return editor.registerCommand(
            SELECTION_CHANGE_COMMAND,
            () => {
                if (disabled) return false;

                editor.getEditorState().read(() => {
                    const selection = $getSelection();
                    if ($isRangeSelection(selection)) {
                        setFormats({
                            bold: selection.hasFormat("bold"),
                            italic: selection.hasFormat("italic"),
                            underline: selection.hasFormat("underline"),
                        });
                    }
                });
                return false;
            },
            COMMAND_PRIORITY_LOW
        );
    }, [editor, disabled]);

    const insertLink = () => {
        if (disabled) return;

        editor.focus();

        setTimeout(() => {
            editor.update(() => {
                const selection = $getSelection();

                if (!$isRangeSelection(selection)) {
                    return;
                }

                const selectedText = selection.getTextContent().trim();
                const rawUrl = window.prompt("Enter URL");
                if (!rawUrl) return;

                const url = normalizeUrl(rawUrl);
                if (!url) return;

                if (selectedText) {
                    editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
                } else {
                    selection.insertText(url);
                    editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
                }
            });

            editor.focus();
        }, 0);
    };

    const insertEmoji = (emoji) => {
        if (disabled) return;

        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                selection.insertText(emoji);
            }
        });
        editor.focus();
    };

    const safeDispatch = (command, payload) => {
        if (disabled) return;
        editor.dispatchCommand(command, payload);
        editor.focus();
    };

    return (
        <div className={`chat-toolbar ${disabled ? "chat-toolbar-disabled" : ""}`}>
            <div className="chat-toolbar-main">
                <Tooltip title="Attach files">
                    <Button
                        type="text"
                        icon={<PaperClipOutlined />}
                        onClick={() => !disabled && onUploadClick?.()}
                        disabled={disabled}
                    />
                </Tooltip>

                <Tooltip title="Bold">
                    <Button
                        type={formats.bold ? "primary" : "text"}
                        icon={<BoldOutlined />}
                        onClick={() => safeDispatch(FORMAT_TEXT_COMMAND, "bold")}
                        disabled={disabled}
                    />
                </Tooltip>

                <Tooltip title="Italic">
                    <Button
                        type={formats.italic ? "primary" : "text"}
                        icon={<ItalicOutlined />}
                        onClick={() => safeDispatch(FORMAT_TEXT_COMMAND, "italic")}
                        disabled={disabled}
                    />
                </Tooltip>

                <Tooltip title="Underline">
                    <Button
                        type={formats.underline ? "primary" : "text"}
                        icon={<UnderlineOutlined />}
                        onClick={() => safeDispatch(FORMAT_TEXT_COMMAND, "underline")}
                        disabled={disabled}
                    />
                </Tooltip>

                <div className="chat-toolbar-divider" />

                <Tooltip title="Bullet list">
                    <Button
                        type="text"
                        icon={<UnorderedListOutlined />}
                        onClick={() => safeDispatch(INSERT_UNORDERED_LIST_COMMAND, undefined)}
                        disabled={disabled}
                    />
                </Tooltip>

                <Tooltip title="Numbered list">
                    <Button
                        type="text"
                        icon={<OrderedListOutlined />}
                        onClick={() => safeDispatch(INSERT_ORDERED_LIST_COMMAND, undefined)}
                        disabled={disabled}
                    />
                </Tooltip>

                <div className="chat-toolbar-divider" />

                <Tooltip title="Insert link">
                    <Button
                        type="text"
                        icon={<LinkOutlined />}
                        onClick={insertLink}
                        disabled={disabled}
                    />
                </Tooltip>
            </div>

            <div className="chat-toolbar-emojis">
                {QUICK_EMOJIS.map((emoji) => (
                    <button
                        key={emoji}
                        type="button"
                        className="chat-toolbar-emoji-btn"
                        onClick={() => insertEmoji(emoji)}
                        disabled={disabled}
                    >
                        {emoji}
                    </button>
                ))}
                <Button type="text" icon={<SmileOutlined />} disabled={disabled} />
            </div>
        </div>
    );
}