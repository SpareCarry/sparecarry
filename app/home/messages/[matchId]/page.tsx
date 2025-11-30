import { ChatPageClient } from "./chat-page-client";

// Required for static export with dynamic routes
export async function generateStaticParams() {
  return [];
}

export default function ChatPage() {
  return <ChatPageClient />;
}
