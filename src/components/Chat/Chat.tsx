import React from "react";
import "./Chat.css";
import { Input } from "../Input/Input";
import { ChatHistory } from "./components/ChatHistory/ChatHistory";

export const Chat = () => {
  return (
    <main className="chat">
      <ChatHistory />
      <Input />
    </main>
  );
};
