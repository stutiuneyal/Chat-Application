import DOMPurify from "dompurify";

export default function RichMessage({ html, text, mine = false }) {
    if (html && html.trim()) {
        return (
            <div
                className={`chat-bubble-content ${mine ? "mine" : "theirs"}`}
                dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(html, {
                        USE_PROFILES: { html: true },
                    }),
                }}
            />
        );
    }

    return <div className="chat-bubble-content">{text || ""}</div>;
}