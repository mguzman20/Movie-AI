"use client";

import {
  ChatBubble,
  ChatBubbleAction,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat/chat-bubble";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { ChatInput } from "@/components/ui/chat/chat-input";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { Button } from "@/components/ui/button";
import {
  CopyIcon,
  CornerDownLeft,
  Mic,
  Paperclip,
  RefreshCcw,
  Volume2,
} from "lucide-react";
import { useChat } from "ai/react";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./globals.css";

const ChatAiIcons = [
  { icon: CopyIcon, label: "Copy" },
  { icon: RefreshCcw, label: "Refresh" },
  { icon: Volume2, label: "Volume" },
];

export default function Home() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [movie, setMovie] = useState("");
  const messagesRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);


  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input) return;
    if (!movie) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput(""); // Clear the input field

    try {
      setIsGenerating(true);

      // Replace with your own API endpoint or backend service
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, movie: movie}),
      });

      if (!response.body) {
        throw new Error("Response body is null");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiMessage = { role: "assistant", content: "" };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode the chunk and try to parse it immediately as JSON
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== "");
        for (const line of lines) {
          try {
              // Parse each line as a JSON object
              const jsonResponse = JSON.parse(line);

              // Append the response to aiMessage content
              aiMessage.content += jsonResponse.response;
              
              // Update messages to display the current content
              setMessages((prev) => [...prev.filter(m => m.role !== 'assistant'), aiMessage]);

              // Break if the JSON response is marked as done
              if (jsonResponse.done) break;
              
          } catch (error) {
              console.warn("Failed to parse JSON chunk:", error);
          }
      }
    }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendMessage();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isGenerating || !input) return;
      sendMessage();
    }
  };

  const handleActionClick = async (action: string, messageIndex: number) => {
    console.log("Action clicked:", action, "Message index:", messageIndex);
    if (action === "Refresh") {
      setIsGenerating(true);
      try {
        await sendMessage();
      } catch (error) {
        console.error("Error reloading:", error);
      } finally {
        setIsGenerating(false);
      }
    }

    if (action === "Copy") {
      const message = messages[messageIndex];
      if (message && message.role === "assistant") {
        navigator.clipboard.writeText(message.content);
      }
    }
  };

  return (
    <main className="flex h-full w-full max-w-4xl flex-col items-center mx-auto pb-6 pt-20">
      <ChatMessageList ref={messagesRef} className="">
        {/* Initial Message */}
        {messages.length === 0 ? (
          <div className="w-full shadow-sm border rounded-lg p-8 flex flex-col justify-center items-center gap-2">
            <h1 className="font-bold text-2xl">Welcome to a movie Ai Chatbot</h1>
            <p className="text-center">
              Ask me anything about <b>Star wars</b> or <b>Lord of the rings</b>. I will try my best to answer your questions.
            </p>
            <p className="text-left text-xl font-bold">Chose a movie to start</p>
            <Select
              value={movie}
              onValueChange={setMovie}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder='Select a movie' />
              </SelectTrigger>
              <SelectContent className="dark">
                    <SelectItem value="Star Wars: The Phantom Menace.txt">Star Wars: The Phantom Menace</SelectItem>
                    <SelectItem value="Star Wars: Attack of the Clones.txt">Star Wars: Attack of the Clones</SelectItem>
                    <SelectItem value="Star Wars: Revenge of the Sith.txt">Star Wars: Revenge of the Sith</SelectItem>
                    <SelectItem value="Star Wars: A New Hope.txt">Star Wars: A New Hope</SelectItem>
                    <SelectItem value="Star Wars: The Empire Strikes Back.txt">Star Wars: The Empire Strikes Back</SelectItem>
                    <SelectItem value="Star Wars: Return of the Jedi.txt">Star Wars: Return of the Jedi</SelectItem>
                    <SelectItem value="Star Wars: The Force Awakens.txt">Star Wars: The Force Awakens</SelectItem>
                    <SelectItem value="Lord of the Rings: The Fellowship of the Ring.txt">Lord of the Rings: The Fellowship of the Ring</SelectItem>
                    <SelectItem value="Lord of the Rings: The Two Towers.txt">Lord of the Rings: The Two Towers</SelectItem>
                    <SelectItem value="Lord of the Rings: The Return of the King.txt">Lord of the Rings: The Return of the King</SelectItem>
              </SelectContent>
            </Select>

          </div>
        ) : (
          <div className="flex justify-end">
            <Select
              value={movie}
              onValueChange={setMovie}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder='Select a movie' />
              </SelectTrigger>
              <SelectContent className="dark">
                    <SelectItem value="Star Wars: The Phantom Menace.txt">Star Wars: The Phantom Menace</SelectItem>
                    <SelectItem value="Star Wars: Attack of the Clones.txt">Star Wars: Attack of the Clones</SelectItem>
                    <SelectItem value="Star Wars: Revenge of the Sith.txt">Star Wars: Revenge of the Sith</SelectItem>
                    <SelectItem value="Star Wars: A New Hope.txt">Star Wars: A New Hope</SelectItem>
                    <SelectItem value="Star Wars: The Empire Strikes Back.txt">Star Wars: The Empire Strikes Back</SelectItem>
                    <SelectItem value="Star Wars: Return of the Jedi.txt">Star Wars: Return of the Jedi</SelectItem>
                    <SelectItem value="Star Wars: The Force Awakens.txt">Star Wars: The Force Awakens</SelectItem>
                    <SelectItem value="Lord of the Rings: The Fellowship of the Ring.txt">Lord of the Rings: The Fellowship of the Ring</SelectItem>
                    <SelectItem value="Lord of the Rings: The Two Towers.txt">Lord of the Rings: The Two Towers</SelectItem>
                    <SelectItem value="Lord of the Rings: The Return of the King.txt">Lord of the Rings: The Return of the King</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
        )}

        {/* Messages */}
        {messages &&
          messages.map((message, index) => (
            <ChatBubble
              key={index}
              variant={message.role == "user" ? "sent" : "received"}
            >
              <ChatBubbleAvatar
                src=""
                fallback={message.role == "user" ? "👨🏽" : "🤖"}
              />
              <ChatBubbleMessage
              >
                {message.content
                  .split("```")
                  .map((part: string, index: number) => {
                    if (index % 2 === 0) {
                      return (
                        <Markdown key={index} remarkPlugins={[remarkGfm]}>
                          {part}
                        </Markdown>
                      );
                    } else {
                      return (
                        <pre className="whitespace-pre-wrap pt-2" key={index}>
                          
                        </pre>
                      );
                    }
                  })}

                {message.role === "assistant" &&
                  messages.length - 1 === index && (
                    <div className="flex items-center mt-1.5 gap-1">
                      {!isGenerating && (
                        <>
                          {ChatAiIcons.map((icon, iconIndex) => {
                            const Icon = icon.icon;
                            return (
                              <ChatBubbleAction
                                variant="outline"
                                className="size-5"
                                key={iconIndex}
                                icon={<Icon className="size-3" />}
                                onClick={() =>
                                  handleActionClick(icon.label, index)
                                }
                              />
                            );
                          })}
                        </>
                      )}
                    </div>
                  )}
              </ChatBubbleMessage>
            </ChatBubble>
          ))}

        {/* Loading */}
        {isGenerating && (
          <ChatBubble variant="received">
            <ChatBubbleAvatar src="" fallback="🤖" />
            <ChatBubbleMessage isLoading />
          </ChatBubble>
        )}
      </ChatMessageList>
      <div className="w-full px-4">
        <form
          ref={formRef}
          onSubmit={onSubmit}
          className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring max-w-3xl mx-auto"
        >
          <ChatInput
            value={input}
            disabled={movie === ""}
            onKeyDown={onKeyDown}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a question about the selected movie..."
            className="min-h-12 resize-none rounded-lg bg-background border-0 p-3 shadow-none focus-visible:ring-0"
          />
          <div className="flex items-center p-3 pt-0">
            <Button variant="ghost" size="icon">
              <Paperclip className="size-4" />
              <span className="sr-only">Attach file</span>
            </Button>

            <Button variant="ghost" size="icon">
              <Mic className="size-4" />
              <span className="sr-only">Use Microphone</span>
            </Button>

            <Button
              disabled={!input}
              type="submit"
              size="sm"
              className="ml-auto gap-1.5"
            >
              Send Message
              <CornerDownLeft className="size-3.5" />
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}


