export function WhatsappFab({ number = "919876543210" }: { number?: string }) {
  return (
    <a
      href={`https://wa.me/${number}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="pulse-whatsapp fixed bottom-6 right-6 z-50 w-[52px] h-[52px] rounded-full flex items-center justify-center"
      style={{ background: "#25d366" }}
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
        <path d="M20 4a10 10 0 0 0-16.6 11L2 22l7.2-1.4A10 10 0 1 0 20 4ZM12 20a8 8 0 0 1-4-1.1l-.3-.2-3.7.7.7-3.6-.2-.3A8 8 0 1 1 12 20Zm4.4-5.7-1.4-.7c-.2 0-.4 0-.5.2l-.5.6c-.2.2-.3.2-.5.1-1.1-.4-2.3-1.5-2.7-2.5 0-.2 0-.4.1-.5l.5-.5c.2-.2.2-.3.3-.5l-.6-1.5c-.2-.4-.5-.4-.8-.4h-.7c-.4 0-.7.1-1 .5-.7.7-1 1.7-.5 2.7.9 2 2.5 3.6 4.5 4.5 1 .4 2 .2 2.7-.5.4-.3.5-.6.5-1l-.1-.5c0-.1-.2-.2-.3-.2Z"/>
      </svg>
    </a>
  );
}
