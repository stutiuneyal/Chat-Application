import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Switch, Tooltip, Modal, message } from "antd";
import {
    SendOutlined,
    CloseOutlined,
    AudioOutlined,
    StopOutlined,
    DeleteOutlined,
    VideoCameraOutlined,
} from "@ant-design/icons";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { LinkNode } from "@lexical/link";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";
import { CodeNode } from "@lexical/code";
import {
    $getRoot,
    $createParagraphNode,
    KEY_ENTER_COMMAND,
    COMMAND_PRIORITY_HIGH,
} from "lexical";
import { $generateHtmlFromNodes } from "@lexical/html";

import ToolbarPlugin from "./../components/chat/ToolbarPlugin";
import lexicalTheme from "./../components/chat/lexicalTheme";

function Placeholder({ disabled }) {
    return (
        <div className={`chat-lexical-placeholder ${disabled ? "is-disabled" : ""}`}>
            {disabled ? "You can no longer send messages here" : "Type a message…"}
        </div>
    );
}

function EnterToSendPlugin({ onSend, disabled }) {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerCommand(
            KEY_ENTER_COMMAND,
            (event) => {
                if (disabled) {
                    event?.preventDefault();
                    return true;
                }

                if (event?.shiftKey) return false;
                event?.preventDefault();
                onSend();
                return true;
            },
            COMMAND_PRIORITY_HIGH
        );
    }, [editor, onSend, disabled]);

    return null;
}

function EditorRefPlugin({ editorRef, disabled }) {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        editorRef.current = editor;
        editor.setEditable(!disabled);

        return () => {
            if (editorRef.current === editor) {
                editorRef.current = null;
            }
        };
    }, [editor, editorRef, disabled]);

    useEffect(() => {
        editor.setEditable(!disabled);
    }, [editor, disabled]);

    return null;
}

function escapeHtml(text = "") {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function plainTextToHtml(text = "") {
    const safe = escapeHtml(text).replace(/\n/g, "<br />");
    return `<p>${safe}</p>`;
}

function formatRecordingTime(totalSeconds) {
    const mins = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const secs = String(totalSeconds % 60).padStart(2, "0");
    return `${mins}:${secs}`;
}

function getPreferredMimeType(types = []) {
    if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
        return "";
    }
    return types.find((type) => MediaRecorder.isTypeSupported?.(type)) || "";
}

function getAudioMimeType() {
    return getPreferredMimeType([
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
    ]);
}

function getVideoMimeType() {
    return getPreferredMimeType([
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
        "video/mp4",
    ]);
}

function getAudioExtension(mimeType = "") {
    if (mimeType.includes("ogg")) return "ogg";
    if (mimeType.includes("mp4")) return "mp4";
    return "webm";
}

function getVideoExtension(mimeType = "") {
    if (mimeType.includes("mp4")) return "mp4";
    return "webm";
}

export default function ChatComposer({
    onSendMessage,
    onTyping,
    replyTo,
    onCancelReply,
    onUploadFiles,
    disabled = false,
}) {
    const editorRef = useRef(null);
    const fileInputRef = useRef(null);
    const liveVideoRef = useRef(null);

    const mediaRecorderRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const mediaChunksRef = useRef([]);
    const speechRecognitionRef = useRef(null);
    const recordingTimerRef = useRef(null);

    const [attachments, setAttachments] = useState([]);
    const [uploading, setUploading] = useState(false);

    const [recordingMode, setRecordingMode] = useState(null); // "audio" | "video" | null
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const [transcriptionEnabled, setTranscriptionEnabled] = useState(false);
    const [transcriptText, setTranscriptText] = useState("");
    const [liveTranscript, setLiveTranscript] = useState("");
    const [videoModalOpen, setVideoModalOpen] = useState(false);

    const isRecording = !!recordingMode;

    const initialConfig = useMemo(
        () => ({
            namespace: "RoomChatComposer",
            theme: lexicalTheme,
            editorState: null,
            editable: !disabled,
            onError(error) {
                console.error("Lexical error:", error);
            },
            nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, CodeNode],
        }),
        [disabled]
    );

    const attachVideoPreview = useCallback(async () => {
        const videoEl = liveVideoRef.current;
        const stream = mediaStreamRef.current;

        if (!videoEl || !stream) return;

        try {
            if (videoEl.srcObject !== stream) {
                videoEl.srcObject = stream;
            }

            videoEl.muted = true;
            videoEl.autoplay = true;
            videoEl.playsInline = true;

            await videoEl.play();
        } catch (err) {
            console.warn("Video preview play failed", err);
        }
    }, []);

    const handleLiveVideoRef = useCallback(
        async (node) => {
            liveVideoRef.current = node;
            if (node && videoModalOpen && recordingMode === "video" && mediaStreamRef.current) {
                await attachVideoPreview();
            }
        },
        [videoModalOpen, recordingMode, attachVideoPreview]
    );

    useEffect(() => {
        return () => {
            stopAllRecordingResources();
        };
    }, []);

    useEffect(() => {
        if (videoModalOpen && recordingMode === "video") {
            requestAnimationFrame(() => {
                attachVideoPreview();
            });
        }
    }, [videoModalOpen, recordingMode, attachVideoPreview]);

    const stopSpeechRecognition = () => {
        if (speechRecognitionRef.current) {
            try {
                speechRecognitionRef.current.onresult = null;
                speechRecognitionRef.current.onerror = null;
                speechRecognitionRef.current.onend = null;
                speechRecognitionRef.current.stop();
            } catch (err) {
                console.warn("Speech recognition stop failed", err);
            }
            speechRecognitionRef.current = null;
        }
    };

    const stopTimer = () => {
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }
    };

    const stopTracks = () => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((track) => track.stop());
            mediaStreamRef.current = null;
        }
        if (liveVideoRef.current) {
            liveVideoRef.current.srcObject = null;
        }
    };

    const stopAllRecordingResources = () => {
        stopTimer();
        stopSpeechRecognition();

        if (mediaRecorderRef.current) {
            try {
                if (mediaRecorderRef.current.state !== "inactive") {
                    mediaRecorderRef.current.stop();
                }
            } catch (err) {
                console.warn("Recorder stop failed", err);
            }
            mediaRecorderRef.current = null;
        }

        stopTracks();
    };

    const clearTranscript = () => {
        if (disabled) return;
        setTranscriptText("");
        setLiveTranscript("");
    };

    const startSpeechRecognition = () => {
        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            message.warning("Voice transcription is not supported in this browser");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event) => {
            let interim = "";
            let finalText = "";

            for (let i = event.resultIndex; i < event.results.length; i += 1) {
                const chunk = event.results[i][0]?.transcript || "";
                if (event.results[i].isFinal) {
                    finalText += `${chunk} `;
                } else {
                    interim += chunk;
                }
            }

            if (finalText.trim()) {
                setTranscriptText((prev) => `${prev} ${finalText}`.trim());
            }
            setLiveTranscript(interim.trim());
        };

        recognition.onerror = (event) => {
            console.warn("Speech recognition error:", event?.error);

            if (event?.error === "network") {
                message.warning("Live transcription is unavailable right now. Recording will continue.");
                stopSpeechRecognition();
            }
        };

        recognition.onend = () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive" && transcriptionEnabled) {
                try {
                    recognition.start();
                } catch (err) {
                    console.warn("Speech recognition restart skipped", err);
                }
            }
        };

        recognition.start();
        speechRecognitionRef.current = recognition;
    };

    const handleFilePick = async (event) => {
        if (disabled) {
            event.target.value = "";
            return;
        }

        const files = Array.from(event.target.files || []);
        if (!files.length) return;

        try {
            setUploading(true);
            const uploaded = await onUploadFiles?.(files);
            if (uploaded?.length) {
                setAttachments((prev) => [...prev, ...uploaded]);
            }
        } catch (err) {
            console.error(err);
            message.error("File upload failed");
        } finally {
            setUploading(false);
            event.target.value = "";
        }
    };

    const removeAttachment = (index) => {
        if (disabled) return;
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    };

    const beginRecording = async (mode) => {
        if (disabled || uploading || isRecording) return;

        const constraints =
            mode === "video"
                ? {
                    audio: true,
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                }
                : { audio: true };

        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log("video tracks", stream.getVideoTracks().map((t) => ({
                label: t.label,
                readyState: t.readyState,
                enabled: t.enabled,
                settings: t.getSettings?.(),
            })));
            const mimeType =
                mode === "video" ? getVideoMimeType() : getAudioMimeType();

            const recorder = mimeType
                ? new MediaRecorder(stream, { mimeType })
                : new MediaRecorder(stream);

            mediaStreamRef.current = stream;
            mediaRecorderRef.current = recorder;
            mediaChunksRef.current = [];
            setRecordingMode(mode);
            setRecordingSeconds(0);
            setLiveTranscript("");

            if (mode === "video") {
                setVideoModalOpen(true);
                setTranscriptionEnabled(true);

                setTimeout(() => {
                    attachVideoPreview();
                }, 0);
            }

            recorder.ondataavailable = (event) => {
                if (event.data) {
                    console.log("video chunk", event.data.size, event.data.type);
                }

                if (event.data && event.data.size > 0) {
                    mediaChunksRef.current.push(event.data);
                }
            };

            recorder.onstop = async () => {
                try {
                    const finalMimeType =
                        recorder.mimeType ||
                        mimeType ||
                        (mode === "video" ? "video/webm" : "audio/webm");

                    if (!mediaChunksRef.current.length) {
                        message.error(
                            mode === "video"
                                ? "No video data was captured"
                                : "No audio data was captured"
                        );
                        return;
                    }

                    const blob = new Blob(mediaChunksRef.current, { type: finalMimeType });

                    if (!blob.size) {
                        message.error(
                            mode === "video"
                                ? "Recorded video is empty"
                                : "Recorded audio is empty"
                        );
                        return;
                    }

                    const extension =
                        mode === "video"
                            ? getVideoExtension(finalMimeType)
                            : getAudioExtension(finalMimeType);

                    const fileName =
                        mode === "video"
                            ? `video-note-${Date.now()}.${extension}`
                            : `voice-note-${Date.now()}.${extension}`;

                    const recordedFile = new File([blob], fileName, {
                        type: finalMimeType,
                    });

                    setUploading(true);
                    const uploaded = await onUploadFiles?.([recordedFile]);

                    if (uploaded?.length) {
                        setAttachments((prev) => [...prev, ...uploaded]);
                        message.success(
                            mode === "video" ? "Video note added" : "Voice note added"
                        );
                    } else {
                        message.error(
                            mode === "video"
                                ? "Video upload returned no files"
                                : "Audio upload returned no files"
                        );
                    }
                } catch (err) {
                    console.error(err);
                    message.error(
                        mode === "video"
                            ? "Failed to process video note"
                            : "Failed to process voice note"
                    );
                } finally {
                    setUploading(false);
                    mediaChunksRef.current = [];
                    setRecordingMode(null);
                    setVideoModalOpen(false);
                    stopTracks();
                }
            };

            recorder.start(1000);
            recordingTimerRef.current = setInterval(() => {
                setRecordingSeconds((prev) => prev + 1);
            }, 1000);

            if (mode === "video" || transcriptionEnabled) {
                startSpeechRecognition();
            }
        } catch (err) {
            console.error(err);
            message.error(
                mode === "video"
                    ? "Camera or microphone permission was denied or unavailable"
                    : "Microphone permission was denied or unavailable"
            );
            setRecordingMode(null);
            setVideoModalOpen(false);
            stopTracks();
        }
    };

    const startAudioRecording = () => beginRecording("audio");
    const startVideoRecording = () => beginRecording("video");

    const stopRecording = () => {
        if (!isRecording) return;

        stopTimer();
        stopSpeechRecognition();

        const recorder = mediaRecorderRef.current;

        if (!recorder) {
            setRecordingMode(null);
            setVideoModalOpen(false);
            stopTracks();
            return;
        }

        try {
            if (recorder.state !== "inactive") {
                try {
                    recorder.requestData();
                } catch (err) {
                    console.warn("requestData failed", err);
                }

                setTimeout(() => {
                    try {
                        recorder.stop();
                    } catch (err) {
                        console.warn("MediaRecorder stop failed", err);
                        setRecordingMode(null);
                        setVideoModalOpen(false);
                        stopTracks();
                    }
                }, 400);
            } else {
                setRecordingMode(null);
                setVideoModalOpen(false);
                stopTracks();
            }
        } catch (err) {
            console.warn("MediaRecorder stop failed", err);
            setRecordingMode(null);
            setVideoModalOpen(false);
            stopTracks();
        }
    };

    const closeVideoModal = () => {
        if (recordingMode === "video") {
            stopRecording();
            return;
        }
        setVideoModalOpen(false);
    };

    const handleSend = async () => {
        if (disabled || isRecording) return;

        const editor = editorRef.current;
        if (!editor) return;

        let editorText = "";
        let editorHtml = "";
        let contentJson = "";

        editor.getEditorState().read(() => {
            editorText = $getRoot().getTextContent().trim();
            editorHtml = $generateHtmlFromNodes(editor, null);
            contentJson = JSON.stringify(editor.getEditorState().toJSON());
        });

        const cleanedTranscript = transcriptText.trim();
        const hasEditorText = !!editorText;
        const hasTranscript = !!cleanedTranscript;

        let contentText = editorText;
        let contentHtml = editorHtml;

        if (!hasEditorText && hasTranscript) {
            contentText = cleanedTranscript;
            contentHtml = plainTextToHtml(cleanedTranscript);
        } else if (hasEditorText && hasTranscript) {
            contentText = `${editorText}\n\n${cleanedTranscript}`;
            contentHtml = `${editorHtml}${plainTextToHtml(cleanedTranscript)}`;
        }

        if (!contentText && attachments.length === 0) return;

        await onSendMessage({
            contentText,
            contentHtml,
            contentJson,
            replyToMessageId: replyTo?.id || null,
            attachments,
        });

        editor.update(() => {
            const root = $getRoot();
            root.clear();
            root.append($createParagraphNode());
        });

        setAttachments([]);
        setTranscriptText("");
        setLiveTranscript("");
        onTyping?.("");
        onCancelReply?.();
        editor.focus();
    };

    const handleChange = (editorState) => {
        if (disabled) return;

        editorState.read(() => {
            onTyping?.($getRoot().getTextContent());
        });
    };

    return (
        <>
            <div className="chat-composer-lexical">
                <div className={`chat-composer-panel ${disabled ? "chat-composer-panel-disabled" : ""}`}>
                    {replyTo ? (
                        <div className="chat-reply-preview">
                            <div className="chat-reply-preview-text">
                                <div className="chat-reply-preview-title">
                                    Replying to {replyTo.senderName || "Unknown"}
                                </div>
                                <div className="chat-reply-preview-body">
                                    {replyTo.contentText || "[message]"}
                                </div>
                            </div>

                            <Button
                                type="text"
                                icon={<CloseOutlined />}
                                onClick={onCancelReply}
                                disabled={disabled}
                            />
                        </div>
                    ) : null}

                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="chat-file-input-hidden"
                        onChange={handleFilePick}
                        disabled={disabled || uploading || isRecording}
                    />

                    <LexicalComposer initialConfig={initialConfig}>
                        <ToolbarPlugin
                            onUploadClick={() => {
                                if (disabled || isRecording) return;
                                fileInputRef.current?.click();
                            }}
                            disabled={disabled || isRecording}
                        />

                        <div className="chat-voice-toolbar">
                            <div className="chat-voice-toolbar-left">
                                <Tooltip title={recordingMode === "audio" ? "Stop audio recording" : "Record voice note"}>
                                    <Button
                                        className={`chat-voice-btn ${recordingMode === "audio" ? "is-recording" : ""}`}
                                        icon={recordingMode === "audio" ? <StopOutlined /> : <AudioOutlined />}
                                        onClick={recordingMode === "audio" ? stopRecording : startAudioRecording}
                                        disabled={disabled || uploading || recordingMode === "video"}
                                    >
                                        {recordingMode === "audio" ? "Stop" : "Record"}
                                    </Button>
                                </Tooltip>

                                <Tooltip title={recordingMode === "video" ? "Stop video recording" : "Record video note"}>
                                    <Button
                                        className={`chat-voice-btn chat-video-btn ${recordingMode === "video" ? "is-recording" : ""}`}
                                        icon={recordingMode === "video" ? <StopOutlined /> : <VideoCameraOutlined />}
                                        onClick={recordingMode === "video" ? stopRecording : startVideoRecording}
                                        disabled={disabled || uploading || recordingMode === "audio"}
                                    >
                                        {recordingMode === "video" ? "Stop video" : "Video"}
                                    </Button>
                                </Tooltip>

                                <div className="chat-voice-transcript-toggle">
                                    <span>Voice to text</span>
                                    <Switch
                                        size="small"
                                        checked={transcriptionEnabled}
                                        onChange={(checked) => {
                                            setTranscriptionEnabled(checked);
                                            if (!checked) {
                                                setLiveTranscript("");
                                                stopSpeechRecognition();
                                            } else if (isRecording) {
                                                startSpeechRecognition();
                                            }
                                        }}
                                        disabled={disabled}
                                    />
                                </div>
                            </div>

                            <div className="chat-voice-toolbar-right">
                                {isRecording ? (
                                    <div className="chat-recording-indicator">
                                        <span className="chat-recording-dot" />
                                        <span>
                                            {recordingMode === "video" ? "Video" : "Recording"} {formatRecordingTime(recordingSeconds)}
                                        </span>
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        {(transcriptText || liveTranscript) && (
                            <div className="chat-transcript-preview">
                                <div className="chat-transcript-preview-header">
                                    <span>Transcript</span>
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<DeleteOutlined />}
                                        onClick={clearTranscript}
                                        disabled={disabled || isRecording}
                                    />
                                </div>

                                <div className="chat-transcript-preview-body">
                                    {transcriptText}
                                    {liveTranscript ? (
                                        <span className="chat-transcript-live">
                                            {transcriptText ? " " : ""}
                                            {liveTranscript}
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        )}

                        {attachments.length > 0 ? (
                            <div className="chat-attachment-strip">
                                {attachments.map((file, index) => (
                                    <div key={`${file.url}-${index}`} className="chat-attachment-chip">
                                        <span className="chat-attachment-name">{file.fileName}</span>
                                        <button
                                            type="button"
                                            className="chat-attachment-remove"
                                            onClick={() => removeAttachment(index)}
                                            disabled={disabled || isRecording}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : null}

                        <div className="chat-input-row">
                            <div className={`chat-lexical-wrapper ${disabled ? "is-disabled" : ""}`}>
                                <RichTextPlugin
                                    contentEditable={
                                        <ContentEditable
                                            className={`chat-lexical-input ${disabled ? "is-disabled" : ""}`}
                                            aria-disabled={disabled}
                                        />
                                    }
                                    placeholder={<Placeholder disabled={disabled} />}
                                    ErrorBoundary={LexicalErrorBoundary}
                                />
                                <HistoryPlugin />
                                <ListPlugin />
                                <LinkPlugin />
                                <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                                <OnChangePlugin onChange={handleChange} />
                                <EnterToSendPlugin onSend={handleSend} disabled={disabled || isRecording} />
                                <EditorRefPlugin editorRef={editorRef} disabled={disabled} />
                            </div>
                        </div>
                    </LexicalComposer>
                </div>

                <Button
                    type="primary"
                    shape="circle"
                    className="chat-send-btn"
                    icon={<SendOutlined />}
                    onClick={handleSend}
                    loading={uploading}
                    disabled={disabled || isRecording}
                />
            </div>

            <Modal
                open={videoModalOpen}
                onCancel={closeVideoModal}
                footer={null}
                centered
                destroyOnClose
                width={760}
                title="Record video note"
                className="chat-video-recording-modal"
            >
                <div className="chat-video-modal-body">
                    <div className="chat-video-preview-shell">
                        <video
                            ref={handleLiveVideoRef}
                            className="chat-video-preview"
                            autoPlay
                            muted
                            playsInline
                        />
                    </div>

                    <div className="chat-video-modal-toolbar">
                        <div className="chat-video-modal-badges">
                            <div className="chat-recording-indicator">
                                <span className="chat-recording-dot" />
                                <span>Video {formatRecordingTime(recordingSeconds)}</span>
                            </div>

                            <div className="chat-voice-transcript-toggle">
                                <span>Transcription</span>
                                <Switch
                                    size="small"
                                    checked={transcriptionEnabled}
                                    onChange={(checked) => {
                                        setTranscriptionEnabled(checked);
                                        if (!checked) {
                                            setLiveTranscript("");
                                            stopSpeechRecognition();
                                        } else if (recordingMode === "video") {
                                            startSpeechRecognition();
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <Button
                            danger
                            className="chat-video-stop-btn"
                            icon={<StopOutlined />}
                            onClick={stopRecording}
                        >
                            Stop & attach
                        </Button>
                    </div>

                    <div className="chat-video-modal-note">
                        Closing this modal will stop recording and attach the video to the composer.
                    </div>

                    {(transcriptText || liveTranscript) && (
                        <div className="chat-transcript-preview chat-video-transcript-preview">
                            <div className="chat-transcript-preview-header">
                                <span>Live transcript</span>
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<DeleteOutlined />}
                                    onClick={clearTranscript}
                                />
                            </div>

                            <div className="chat-transcript-preview-body">
                                {transcriptText}
                                {liveTranscript ? (
                                    <span className="chat-transcript-live">
                                        {transcriptText ? " " : ""}
                                        {liveTranscript}
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
}