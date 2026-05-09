export function TypingIndicator() {
  return (
    <div className="bg-app-bubble-bot rounded-2xl rounded-bl-sm px-4 py-3 inline-flex items-center gap-1.5">
      <span className="typing-dot inline-block w-1.5 h-1.5 rounded-full bg-app-text-dim" />
      <span className="typing-dot inline-block w-1.5 h-1.5 rounded-full bg-app-text-dim" />
      <span className="typing-dot inline-block w-1.5 h-1.5 rounded-full bg-app-text-dim" />
    </div>
  );
}
