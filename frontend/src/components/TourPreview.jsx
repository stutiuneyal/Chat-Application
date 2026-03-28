export default function TourPreview({ step }) {
    return (
        <div className="aurora-tour-preview">
            <img
                src="/tour/chat-preview.png"
                alt="Chat preview"
                className="aurora-tour-image"
            />

            {step === "workspace" && (
                <div className="tour-highlight workspace" />
            )}

            {step === "actions" && (
                <div className="tour-highlight actions" />
            )}

            {step === "composer" && (
                <div className="tour-highlight composer" />
            )}
        </div>
    );
}